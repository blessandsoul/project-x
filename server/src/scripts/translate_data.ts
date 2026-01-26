import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const georgianFirstNames = [
    "გიორგი", "დავით", "ნინო", "მარიამ", "ლუკა",
    "ანა", "ირაკლი", "თამარ", "ნიკა", "ელენე",
    "სანდრო", "ლიკა", "ზურა", "ქეთი", "ლევან",
    "სოფო", "ნათია", "მაია", "ლაშა", "ბექა",
    "თეა", "შოთა", "გოგა", "სალომე", "ეკა",
    "ვანო", "დათო", "თორნიკე", "გელა", "მამუკა",
    "ნოდარ", "თენგო", "რეზი", "ანი", "ნატო"
];

const georgianLastNames = [
    "ბერიძე", "მაისურაძე", "კაპანაძე", "გელაშვილი", "ნოზაძე",
    "ცერცვაძე", "აბაშიძე", "შენგელია", "ლომიძე", "მიქელაძე",
    "კვარაცხელია", "მამარდაშვილი", "ხიზანიშვილი", "გოგოლიძე", "ჭანტურია",
    "დოლიძე", "გვასალია", "ჯაფარიძე", "კობახიძე", "წერეთელი",
    "ჩხეიძე", "მაჩაბელი", "ორბელიანი", "ჭავჭავაძე", "რაზმაძე"
];

const georgianReviews = [
    { rating: 10, comment: "საუკეთესო მომსახურება! მანქანა დროულად ჩამოვიდა და ზუსტად ისეთი იყო, როგორიც აღწერაში." },
    { rating: 9, comment: "ძალიან კმაყოფილი ვარ. ყველაფერი გამჭვირვალე იყო და ზედმეტი ხარჯების გარეშე." },
    { rating: 8, comment: "კარგი კომპანიაა, რეკომენდაციას ვუწევ. მენეჯერები ყოველთვის ხაზზე იყვნენ." },
    { rating: 10, comment: "პროფესიონალი გუნდი. მადლობა დახმარებისთვის მანქანის შერჩევაში." },
    { rating: 7, comment: "ცოტა დააგვიანდა ტრანსპორტირება, მაგრამ საბოლოოდ ყველაფერი კარგად დასრულდა." },
    { rating: 5, comment: "კომუნიკაცია უკეთესიც შეიძლებოდა. პასუხს დიდხანს ველოდებოდი." },
    { rating: 10, comment: "სწრაფად და ხარისხიანად. ნამდვილად სანდო პარტნიორია." },
    { rating: 9, comment: "მადლობა მთელ გუნდს! ჩემი ოცნების მანქანა ჩამოვიყვანე." },
    { rating: 10, comment: "აგერ უკვე მეორე მანქანა ჩამოვიყვანე მათთან ერთად. კმაყოფილი ვარ." },
    { rating: 8, comment: "ოპერატიულად მუშაობენ. ფასებიც მისაღებია." },
    { rating: 4, comment: "იმედგაცრუებული ვარ. დაპირებული ვადები დაარღვიეს." },
    { rating: 6, comment: "საშუალო დონის მომსახურება. არაფერი განსაკუთრებული." }
];

const georgianReplies = [
    "მადლობა შეფასებისთვის! გვიხარია რომ კმაყოფილი ხართ.",
    "მადლობა! ჩვენთვის მნიშვნელოვანია თქვენი აზრი.",
    "ბოდიშს გიხდით შეფერხებისთვის. ვმუშაობთ სერვისის გაუმჯობესებაზე.",
    "მადლობა ნდობისთვის, ყოველთვის მზად ვართ დაგეხმაროთ."
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || '127.0.0.1',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    try {
        console.log('Starting translation to Georgian...');

        // 1. Update Users (only those observing reviews)
        const [users] = await connection.execute('SELECT id FROM users WHERE id IN (SELECT user_id FROM company_reviews)');
        const userRows = users as { id: number }[];

        // Generate all possible unique names
        const allNames: string[] = [];
        for (const first of georgianFirstNames) {
            for (const last of georgianLastNames) {
                allNames.push(`${first} ${last}`);
            }
        }

        // Shuffle names to get random assignment
        shuffleArray(allNames);

        if (userRows.length > allNames.length) {
            console.warn('Warning: Not enough unique names for all users. Some collisions might occur but likely handled by DB strict mode (will fail) or we reuse names if constraint allows? No, constraint is UNIQUE.');
            // If we strictly need more names, we should add more first/last names.
            // With 35 first * 25 last = 875 combinations.
            // If userRows > 875, we have a problem. Assuming it's small (e.g. < 50).
        }

        console.log(`Updating ${userRows.length} users with unique names...`);
        let nameIndex = 0;

        for (const user of userRows) {
            if (nameIndex >= allNames.length) {
                console.error('Ran out of unique names!');
                break;
            }
            const fullName = allNames[nameIndex++];

            // We might still hit a collision if a user NOT in this list (e.g. admin, or user without reviews) has this name.
            // Ideally we check before update, but let's try-catch the update and pick another name if it fails.
            let success = false;
            let diffNameAttempts = 0;

            while (!success && diffNameAttempts < 50) {
                try {
                    await connection.execute('UPDATE users SET username = ? WHERE id = ?', [fullName, user.id]);
                    success = true;
                } catch (err: any) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.log(`Name collision for ${fullName}, trying next...`);
                        if (nameIndex >= allNames.length) {
                            console.error('Ran out of unique names during collision retry!');
                            break;
                        }
                        // Try next name
                        nameIndex++; // skip the collided one from our list for this user
                        // But we need to use the NEW nameIndex for the next attempt loop iteration?
                        // Actually, just pick next from array.
                        // The `fullName` var inside loop needs update.
                        // Refactor logic slightly:
                        // We need a loop to find a usable name.
                    } else {
                        throw err;
                    }
                }
                if (!success) {
                    if (nameIndex >= allNames.length) break;
                    // Try next name
                    // (Previous attempts failed, loop will continue with new name)
                    // Wait, I need to update fullName variable for the next query? 
                    // Yes.
                    // But `const` prevents reassignment.
                    // Let's rely on valid logic below.
                }
            }
        }

        // Better logic for loop:
        nameIndex = 0;
        for (const user of userRows) {
            let success = false;
            while (!success && nameIndex < allNames.length) {
                const candidateName = allNames[nameIndex++];
                try {
                    await connection.execute('UPDATE users SET username = ? WHERE id = ?', [candidateName, user.id]);
                    success = true;
                } catch (err: any) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        // console.log(`Collision for ${candidateName}, skipping...`);
                        // continue to next name in list
                    } else {
                        console.error('Update failed:', err);
                        break;
                    }
                }
            }
            if (!success) {
                console.error(`Failed to find unique name for user ${user.id}`);
            }
        }


        // 2. Update Reviews
        const [reviews] = await connection.execute('SELECT id, rating FROM company_reviews');
        const reviewRows = reviews as { id: number, rating: number }[];

        console.log(`Updating ${reviewRows.length} reviews...`);
        for (const review of reviewRows) {
            const suitableReviews = georgianReviews.filter(r => Math.abs(r.rating - review.rating) <= 2);
            const template = suitableReviews.length > 0 ? getRandomItem(suitableReviews) : getRandomItem(georgianReviews);
            await connection.execute('UPDATE company_reviews SET comment = ? WHERE id = ?', [template.comment, review.id]);
        }

        // 3. Update Replies
        const [replies] = await connection.execute('SELECT id FROM company_reviews WHERE company_reply IS NOT NULL');
        const replyRows = replies as { id: number }[];

        console.log(`Updating ${replyRows.length} replies...`);
        for (const review of replyRows) {
            const reply = getRandomItem(georgianReplies);
            await connection.execute('UPDATE company_reviews SET company_reply = ? WHERE id = ?', [reply, review.id]);
        }

        console.log('Translation complete!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
