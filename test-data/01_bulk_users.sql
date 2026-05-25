-- =============================================================================
-- VaibhavVivaahaApp — Bulk Test Users (100 per caste × 5 castes = 500 users)
-- Run on: uravugal (production) / vvm_db (local)
-- All accounts: mobile = 900{casteId}0{5-digit-seq}, PIN = 1234 (base64: MTIzNA==)
-- Safe to re-run: stored proc checks existing mobile before inserting.
-- =============================================================================

USE uravugal;

-- Drop and recreate procedure for idempotency
DROP PROCEDURE IF EXISTS sp_insert_bulk_users;

DELIMITER $$

CREATE PROCEDURE sp_insert_bulk_users(IN p_caste_id INT)
BEGIN
    DECLARE i           INT DEFAULT 1;
    DECLARE v_gender    VARCHAR(1);
    DECLARE v_mobile    VARCHAR(20);
    DECLARE v_email     VARCHAR(100);
    DECLARE v_member_id VARCHAR(50);
    DECLARE v_dob       DATE;
    DECLARE v_age       VARCHAR(10);
    DECLARE v_location  VARCHAR(100);
    DECLARE v_first_name VARCHAR(100);
    DECLARE v_last_name  VARCHAR(100);
    DECLARE v_user_id   BIGINT;
    DECLARE v_height    VARCHAR(20);
    DECLARE v_weight    VARCHAR(20);
    DECLARE v_occupation VARCHAR(100);
    DECLARE v_income    VARCHAR(50);
    DECLARE v_degree    VARCHAR(100);
    DECLARE v_employed  VARCHAR(20);
    DECLARE v_star      VARCHAR(60);
    DECLARE v_moon      VARCHAR(60);
    DECLARE v_dosham    VARCHAR(60);

    WHILE i <= 100 DO

        -- Gender: odd = Male, even = Female
        IF i % 2 = 1 THEN SET v_gender = 'M'; ELSE SET v_gender = 'F'; END IF;

        SET v_mobile    = CONCAT('900', p_caste_id, '0', LPAD(i, 5, '0'));
        SET v_email     = CONCAT('bulk', p_caste_id, LPAD(i, 5, '0'), '@vvm.test');
        SET v_member_id = CONCAT('BLK', p_caste_id, LPAD(i, 5, '0'));

        -- Skip if mobile already exists
        IF (SELECT COUNT(*) FROM users WHERE mobile = v_mobile) = 0 THEN

            -- DOB: cycles across 1990–1999 (every 3.65 days = one year per 10 users)
            SET v_dob = DATE_ADD('1990-01-01', INTERVAL (((i - 1) * 37) % 3650) DAY);
            SET v_age = CAST(FLOOR(DATEDIFF(CURDATE(), v_dob) / 365) AS CHAR);

            -- Location cycles 10 Tamil Nadu cities
            SET v_location = ELT((i % 10) + 1,
                'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Trichy',
                'Erode', 'Vellore', 'Thanjavur', 'Tirunelveli', 'Tirupur');

            -- First name by gender, cycling 10 names
            IF v_gender = 'M' THEN
                SET v_first_name = ELT((i % 10) + 1,
                    'Arjun', 'Karthik', 'Murugan', 'Senthil', 'Vijay',
                    'Praveen', 'Anand', 'Suresh', 'Rajan', 'Ganesh');
            ELSE
                SET v_first_name = ELT((i % 10) + 1,
                    'Priya', 'Deepa', 'Kavitha', 'Meena', 'Sangeetha',
                    'Lakshmi', 'Anu', 'Divya', 'Swetha', 'Geetha');
            END IF;

            SET v_last_name = ELT((i % 8) + 1,
                'Kumar', 'Raj', 'Murugan', 'Selvan', 'Kannan',
                'Balan', 'Rajan', 'Pandiyan');

            -- Height
            IF v_gender = 'M' THEN
                SET v_height = CONCAT('5''', ((i % 7) + 5), '"');
            ELSE
                SET v_height = CONCAT('5''', (i % 6), '"');
            END IF;

            -- Weight
            IF v_gender = 'M' THEN
                SET v_weight = CONCAT(60 + (i % 30), ' kg');
            ELSE
                SET v_weight = CONCAT(50 + (i % 20), ' kg');
            END IF;

            -- Occupation cycles 8
            SET v_occupation = ELT((i % 8) + 1,
                'Software Engineer', 'Teacher', 'Doctor', 'Business',
                'Engineer', 'Government Employee', 'Accountant', 'Nurse');

            -- Annual income cycles 7
            SET v_income = ELT((i % 7) + 1,
                '2-3L', '3-5L', '5-7L', '7-10L', '10-15L', '15-20L', '20L+');

            -- Degree cycles 8
            SET v_degree = ELT((i % 8) + 1,
                'B.E', 'B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com');

            -- Employment type cycles 3
            SET v_employed = ELT((i % 3) + 1, 'PRIVATE', 'GOVT', 'SELF');

            -- Star (Nakshatra) cycles 10
            SET v_star = ELT((i % 10) + 1,
                'Aswini', 'Bharani', 'Karthigai', 'Rohini', 'Mirugashirisham',
                'Thiruvadhirai', 'Punarpoosam', 'Poosam', 'Ayilyam', 'Magam');

            -- Moon sign (Rasi) matching stars
            SET v_moon = ELT((i % 10) + 1,
                'Mesham', 'Mesham', 'Rishabam', 'Rishabam', 'Mithunam',
                'Mithunam', 'Kadagam', 'Kadagam', 'Kadagam', 'Simmam');

            -- Dosham cycles
            SET v_dosham = ELT((i % 10) + 1,
                'None', 'Manglik (Chevvai Dosham)', 'None', 'None', 'Rahu Dosham',
                'None', 'None', 'Kuja Dosham', 'None', 'None');

            -- ── INSERT USER ──────────────────────────────────────────────────
            INSERT INTO users (
                createdAt, createdBy, isActive,
                memberId, firstName, lastName, email, mobile, pin,
                gender, dob, age, casteId, location,
                userStatus, isBlocked, isUser, isOnline, profileCreated, view_count
            ) VALUES (
                NOW(), 'test-seed', 'Y',
                v_member_id, v_first_name, v_last_name, v_email, v_mobile, 'MTIzNA==',
                v_gender, v_dob, v_age, p_caste_id, v_location,
                'APPROVED', 'N', 'FA', 0, 'Y', 0
            );

            SET v_user_id = LAST_INSERT_ID();

            -- ── INSERT USER DETAILS ──────────────────────────────────────────
            INSERT INTO user_details (
                createdAt, createdBy, isActive, userId,
                height, weight, occupation, annualIncome, degree,
                employedAt, jobPlace, connectionCount, visitCount, interestCount,
                about, aboutFamily, permanentAddress, presentAddress,
                basicInfo, familyInfo, astroInfo
            ) VALUES (
                NOW(), 'test-seed', 'Y', v_user_id,
                v_height, v_weight, v_occupation, v_income, v_degree,
                v_employed, v_location, 0, 0, 0,
                CONCAT('Looking for a life partner. Based in ', v_location, '.'),
                'Middle class family with traditional values.',
                v_location, v_location,
                -- basicInfo JSON
                JSON_OBJECT(
                    'marital_status',      'Never Married',
                    'place_of_birth',      UPPER(v_location),
                    'mother_language',     'Tamil',
                    'physical_status',     'Normal',
                    'number_of_children',  ''
                ),
                -- familyInfo JSON (array with one object)
                JSON_ARRAY(JSON_OBJECT(
                    'house',              'OWN HOUSE',
                    'father',             CONCAT('Father', i),
                    'mother',             CONCAT('Mother', i),
                    'family_type',        'Traditional',
                    'no_of_sister',       CAST(i % 3 AS CHAR),
                    'family_status',      'Middle Class',
                    'no_of_brother',      CAST(i % 2 AS CHAR),
                    'brother_sister',     NULL,
                    'no_of_siblings',     CAST((i % 3) + 1 AS CHAR),
                    'sister_married',     '0',
                    'brother_married',    '0',
                    'father_occupation',  'Business',
                    'mother_occupation',  'House Wife'
                )),
                -- astroInfo JSON (array with one object)
                JSON_ARRAY(JSON_OBJECT(
                    'star',     v_star,
                    'dosham',   v_dosham,
                    'sun_sign', 'None',
                    'moon_sign', v_moon
                ))
            );

        END IF; -- end duplicate check

        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

-- ── EXECUTE FOR ALL 5 CASTES ────────────────────────────────────────────────
SELECT 'Inserting VANNIYAR bulk users (casteId=1)...' AS status;
CALL sp_insert_bulk_users(1);

SELECT 'Inserting NAIDU bulk users (casteId=2)...' AS status;
CALL sp_insert_bulk_users(2);

SELECT 'Inserting AADITRAVIDAR bulk users (casteId=3)...' AS status;
CALL sp_insert_bulk_users(3);

SELECT 'Inserting MUDALIAR bulk users (casteId=4)...' AS status;
CALL sp_insert_bulk_users(4);

SELECT 'Inserting FREECASTEBAR bulk users (casteId=5)...' AS status;
CALL sp_insert_bulk_users(5);

-- Cleanup procedure after use
DROP PROCEDURE IF EXISTS sp_insert_bulk_users;

-- ── VERIFICATION ─────────────────────────────────────────────────────────────
SELECT c.id, c.casteName, COUNT(*) AS total_users
FROM users u
JOIN castes c ON u.casteId = c.id
GROUP BY c.id, c.casteName
ORDER BY c.id;
