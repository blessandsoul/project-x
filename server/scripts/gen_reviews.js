const englishReviews = [
    { rating: 5, text: "Excellent service! The car arrived earlier than expected." },
    { rating: 5, text: "Very professional team. Keeps you updated throughout the process." },
    { rating: 4, text: "Good experience overall, reasonable prices." },
    { rating: 5, text: "Highly recommended! Best shipping company I have used." },
    { rating: 4, text: "Car was safe, but delivery took a few days longer." },
    { rating: 3, text: "Communication could be better, but the car arrived fine." },
    { rating: 5, text: "Smooth transaction from start to finish." },
    { rating: 2, text: "Hidden fees were not mentioned initially. Be careful." },
    { rating: 1, text: "Terrible service. Nobody answers the phone." },
    { rating: 5, text: "Great job guys! Will use again." }
];

const georgianReviews = [
    { rating: 5, text: "საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა." },
    { rating: 5, text: "ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს." },
    { rating: 4, text: "კარგი კომპანიაა, თუმცა ცოტა ძვირია." },
    { rating: 5, text: "მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ." },
    { rating: 3, text: "პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია." },
    { rating: 5, text: "პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს." },
    { rating: 4, text: "ნორმალური სერვისია, პრეტენზიები არ მაქვს." },
    { rating: 2, text: "არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო." },
    { rating: 1, text: "არ გირჩევთ, ძალიან აგვიანებენ." },
    { rating: 5, text: "ყველაფერი სუპერ! 10/10" }
];

let sql = "-- Insert realistic reviews for 20 companies (15-30 reviews per company)\n";

// Generate user emails list
const userEmails = [];
userEmails.push('user@gmail.com');
for (let i = 1; i < 30; i++) {
    userEmails.push(`user${i}@gmail.com`);
}

// Helper to shuffle array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

for (let i = 1; i <= 20; i++) {
    const companyEmail = `company${i}@gmail.com`;

    // Choose number of reviews for this company (15 to 30)
    // Capping at 29 because we only have 29 unique additional users + 1 main user = 30 total.
    // So 30 is max unique users.
    const numReviews = Math.floor(Math.random() * (30 - 15 + 1)) + 15;

    // Pick unique users
    const reviewers = shuffle([...userEmails]).slice(0, numReviews);

    sql += `\n-- Reviews for Company ${i} (${numReviews} reviews)\n`;

    reviewers.forEach(userEmail => {
        // Decide language (50/50)
        const isGeo = Math.random() > 0.5;
        const pool = isGeo ? georgianReviews : englishReviews;

        // Pick random review from pool
        const review = pool[Math.floor(Math.random() * pool.length)];

        // Add some noise to rating (e.g. 4.8 instead of 5, or just keep integer) 
        // Keeping integer for SQL DECIMAL usually fine, but let's make it look slightly varied if schema is decimal
        // Schema is DECIMAL(3,1).
        const rating = review.rating;

        sql += `INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, ${rating}, '${review.text}', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = '${companyEmail}' AND u.email = '${userEmail}';\n`;
    });
}

console.log(sql);
