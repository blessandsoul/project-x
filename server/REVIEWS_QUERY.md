# Generated Reviews SQL Query  
  
`sql  
-- Insert realistic reviews for 20 companies (15-30 reviews per company) - 10 Point System

-- Reviews for Company 1 (15 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company1@gmail.com' AND u.email = 'user7@gmail.com';

-- Reviews for Company 2 (26 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company2@gmail.com' AND u.email = 'user3@gmail.com';

-- Reviews for Company 3 (29 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company3@gmail.com' AND u.email = 'user25@gmail.com';

-- Reviews for Company 4 (16 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company4@gmail.com' AND u.email = 'user29@gmail.com';

-- Reviews for Company 5 (17 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company5@gmail.com' AND u.email = 'user25@gmail.com';

-- Reviews for Company 6 (22 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company6@gmail.com' AND u.email = 'user14@gmail.com';

-- Reviews for Company 7 (25 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company7@gmail.com' AND u.email = 'user9@gmail.com';

-- Reviews for Company 8 (28 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company8@gmail.com' AND u.email = 'user1@gmail.com';

-- Reviews for Company 9 (27 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company9@gmail.com' AND u.email = 'user14@gmail.com';

-- Reviews for Company 10 (28 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company10@gmail.com' AND u.email = 'user22@gmail.com';

-- Reviews for Company 11 (21 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company11@gmail.com' AND u.email = 'user24@gmail.com';

-- Reviews for Company 12 (24 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company12@gmail.com' AND u.email = 'user8@gmail.com';

-- Reviews for Company 13 (30 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company13@gmail.com' AND u.email = 'user24@gmail.com';

-- Reviews for Company 14 (25 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company14@gmail.com' AND u.email = 'user9@gmail.com';

-- Reviews for Company 15 (27 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company15@gmail.com' AND u.email = 'user12@gmail.com';

-- Reviews for Company 16 (24 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company16@gmail.com' AND u.email = 'user10@gmail.com';

-- Reviews for Company 17 (15 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company17@gmail.com' AND u.email = 'user29@gmail.com';

-- Reviews for Company 18 (18 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Hidden fees were not mentioned initially. Be careful.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ გირჩევთ, ძალიან აგვიანებენ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company18@gmail.com' AND u.email = 'user5@gmail.com';

-- Reviews for Company 19 (23 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user2@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user28@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'არ მომეწონა მომსახურება, ბევრი გაუგებრობა იყო.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user5@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Excellent service! The car arrived earlier than expected.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user7@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user20@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company19@gmail.com' AND u.email = 'user9@gmail.com';

-- Reviews for Company 20 (26 reviews)
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user21@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user25@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user3@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user8@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user17@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user10@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Very professional team. Keeps you updated throughout the process.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user6@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'პასუხის ლოდინი დიდხანს მომიწია, მაგრამ მანქანა კარგია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'ძალიან კმაყოფილი ვარ, სწრაფად ჩამოიყვანეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user22@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Smooth transaction from start to finish.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user18@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user11@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user19@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'ყველაფერი სუპერ! 10/10', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user9@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user24@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.2, 'Terrible service. Nobody answers the phone.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user29@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Great job guys! Will use again.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user16@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Car was safe, but delivery took a few days longer.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user23@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'პროფესიონალები არიან, ყველაფერი დროულად მოაგვარეს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user13@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'საუკეთესო მომსახურებაა! მანქანა დაუზიანებლად ჩამოვიდა.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user1@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'ნორმალური სერვისია, პრეტენზიები არ მაქვს.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user12@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user15@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'Highly recommended! Best shipping company I have used.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user26@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 5.0, 'მადლობა ყველაფრისთვის, რეკომენდაციას ვუწევ.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user14@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Good experience overall, reasonable prices.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user27@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'კარგი კომპანიაა, თუმცა ცოტა ძვირია.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user4@gmail.com';
INSERT INTO company_reviews (company_id, user_id, rating, comment, created_at)
SELECT c.id, u.id, 4.9, 'Communication could be better, but the car arrived fine.', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY)
FROM companies c, users u
WHERE c.contact_email = 'company20@gmail.com' AND u.email = 'user20@gmail.com';

  
` 
