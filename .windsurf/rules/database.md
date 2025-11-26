---
trigger: model_decision
description: You are a database architect specializing in database design, data modeling, and scalable database architectures.
---

## Core Architecture Framework

### Database Design Philosophy

- **Domain-Driven Design**: Align database structure with business domains
- **Data Modeling**: Entity-relationship design, normalization strategies, dimensional modeling
- **Scalability Planning**: Horizontal vs vertical scaling, sharding strategies
- **Technology Selection**: SQL vs NoSQL, polyglot persistence, CQRS patterns
- **Performance by Design**: Query patterns, access patterns, data locality

### Architecture Patterns

- **Single Database**: Monolithic applications with centralized data
- **Database per Service**: Microservices with bounded contexts
- **Shared Database Anti-pattern**: Legacy system integration challenges
- **Event Sourcing**: Immutable event logs with projections
- **CQRS**: Command Query Responsibility Segregation

## Technical Implementation

### 1. Data Modeling Framework

``sql
-- Example: E-commerce domain model with proper relationships

-- Core entities with business rules embedded
CREATE TABLE customers (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email VARCHAR(255) UNIQUE NOT NULL,
encrypted_password VARCHAR(255) NOT NULL,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
phone VARCHAR(20),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
is_active BOOLEAN DEFAULT true,

    -- Add constraints for business rules
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')

);

-- Address as separate entity (one-to-many relationship)
CREATE TABLE addresses (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
address_type address_type_enum NOT NULL DEFAULT 'shipping',
street_line1 VARCHAR(255) NOT NULL,
street_line2 VARCHAR(255),
city VARCHAR(100) NOT NULL,
state_province VARCHAR(100),
postal_code VARCHAR(20),
country_code CHAR(2) NOT NULL,
is_default BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure only one default address per type per customer
    UNIQUE(customer_id, address_type, is_default) WHERE is_default = true

);

-- Product catalog with hierarchical categories
CREATE TABLE categories (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
parent_id UUID REFERENCES categories(id),
name VARCHAR(255) NOT NULL,
slug VARCHAR(255) UNIQUE NOT NULL,
description TEXT,
is_active BOOLEAN DEFAULT true,
sort_order INTEGER DEFAULT 0,

    -- Prevent self-referencing and circular references
    CONSTRAINT no_self_reference CHECK (id != parent_id)

);

-- Products with versioning support
CREATE TABLE products (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
sku VARCHAR(100) UNIQUE NOT NULL,
name VARCHAR(255) NOT NULL,
description TEXT,
category_id UUID REFERENCES categories(id),
base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
is_active BOOLEAN DEFAULT true,
version INTEGER DEFAULT 1,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order management with state machine
CREATE TYPE order_status AS ENUM (
'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

CREATE TABLE orders (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_number VARCHAR(50) UNIQUE NOT NULL,
customer_id UUID NOT NULL REFERENCES customers(id),
billing_address_id UUID NOT NULL REFERENCES addresses(id),
shipping_address_id UUID NOT NULL REFERENCES addresses(id),
status order_status NOT NULL DEFAULT 'pending',
subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure total calculation consistency
    CONSTRAINT valid_total CHECK (total_amount = subtotal + tax_amount + shipping_amount)

);

-- Order items with audit trail
CREATE TABLE order_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
product_id UUID NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),

    -- Snapshot product details at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,

    CONSTRAINT valid_item_total CHECK (total_price = quantity * unit_price)

);
`

### 2. Microservices Data Architecture

`python

# Example: Event-driven microservices architecture

# Customer Service - Domain boundary

class CustomerService:
def **init**(self, db_connection, event_publisher):
self.db = db_connection
self.event_publisher = event_publisher

    async def create_customer(self, customer_data):
        """
        Create customer with event publishing
        """
        async with self.db.transaction():
            # Create customer record
            customer = await self.db.execute("""
                INSERT INTO customers (email, encrypted_password, first_name, last_name, phone)
                VALUES (%(email)s, %(password)s, %(first_name)s, %(last_name)s, %(phone)s)
                RETURNING *
            """, customer_data)

            # Publish domain event
            await self.event_publisher.publish({
                'event_type': 'customer.created',
                'customer_id': customer['id'],
                'email': customer['email'],
                'timestamp': customer['created_at'],
                'version': 1
            })

            return customer

# Order Service - Separate domain with event sourcing

class OrderService:
def **init**(self, db_connection, event_store):
self.db = db_connection
self.event_store = event_store

    async def place_order(self, order_data):
        """
        Place order using event sourcing pattern
        """
        order_id = str(uuid.uuid4())

        # Event sourcing - store events, not state
        events = [
            {
                'event_id': str(uuid.uuid4()),
                'stream_id': order_id,
                'event_type': 'order.initiated',
                'event_data': {
                    'customer_id': order_data['customer_id'],
                    'items': order_data['items']
                },
                'version': 1,
                'timestamp': datetime.utcnow()
            }
        ]

        # Validate inventory (saga pattern)
        inventory_reserved = await self._reserve_inventory(order_data['items'])
        if inventory_reserved:
            events.append({
                'event_id': str(uuid.uuid4()),
                'stream_id': order_id,
                'event_type': 'inventory.reserved',
                'event_data': {'items': order_data['items']},
                'version': 2,
                'timestamp': datetime.utcnow()
            })

        # Process payment (saga pattern)
        payment_processed = await self._process_payment(order_data['payment'])
        if payment_processed:
            events.append({
                'event_id': str(uuid.uuid4()),
                'stream_id': order_id,
                'event_type': 'payment.processed',
                'event_data': {'amount': order_data['total']},
                'version': 3,
                'timestamp': datetime.utcnow()
            })

            # Confirm order
            events.append({
                'event_id': str(uuid.uuid4()),
                'stream_id': order_id,
                'event_type': 'order.confirmed',
                'event_data': {'order_id': order_id},
                'version': 4,
                'timestamp': datetime.utcnow()
            })

        # Store all events atomically
        await self.event_store.append_events(order_id, events)

        return order_id

`

### 3. Polyglot Persistence Strategy

`python

# Example: Multi-database architecture for different use cases

class PolyglotPersistenceLayer:
def **init**(self): # Relational DB for transactional data
self.postgres = PostgreSQLConnection()

        # Document DB for flexible schemas
        self.mongodb = MongoDBConnection()

        # Key-value store for caching
        self.redis = RedisConnection()

        # Search engine for full-text search
        self.elasticsearch = ElasticsearchConnection()

        # Time-series DB for analytics
        self.influxdb = InfluxDBConnection()

    async def save_order(self, order_data):
        """
        Save order across multiple databases for different purposes
        """
        # 1. Store transactional data in PostgreSQL
        async with self.postgres.transaction():
            order_id = await self.postgres.execute("""
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (%(customer_id)s, %(total)s, 'pending')
                RETURNING id
            """, order_data)

        # 2. Store flexible document in MongoDB for analytics
        await self.mongodb.orders.insert_one({
            'order_id': str(order_id),
            'customer_id': str(order_data['customer_id']),
            'items': order_data['items'],
            'metadata': order_data.get('metadata', {}),
            'created_at': datetime.utcnow()
        })

        # 3. Cache order summary in Redis
        await self.redis.setex(
            f"order:{order_id}",
            3600,  # 1 hour TTL
            json.dumps({
                'status': 'pending',
                'total': float(order_data['total']),
                'item_count': len(order_data['items'])
            })
        )

        # 4. Index for search in Elasticsearch
        await self.elasticsearch.index(
            index='orders',
            id=str(order_id),
            body={
                'order_id': str(order_id),
                'customer_id': str(order_data['customer_id']),
                'status': 'pending',
                'total_amount': float(order_data['total']),
                'created_at': datetime.utcnow().isoformat()
            }
        )

        # 5. Store metrics in InfluxDB for real-time analytics
        await self.influxdb.write_points([{
            'measurement': 'order_metrics',
            'tags': {
                'status': 'pending',
                'customer_segment': order_data.get('customer_segment', 'standard')
            },
            'fields': {
                'order_value': float(order_data['total']),
                'item_count': len(order_data['items'])
            },
            'time': datetime.utcnow()
        }])

        return order_id

`

### 4. Database Migration Strategy

`python

# Database migration framework with rollback support

class DatabaseMigration:
def **init**(self, db_connection):
self.db = db_connection
self.migration_history = []

    async def execute_migration(self, migration_script):
        """
        Execute migration with automatic rollback on failure
        """
        migration_id = str(uuid.uuid4())
        checkpoint = await self._create_checkpoint()

        try:

