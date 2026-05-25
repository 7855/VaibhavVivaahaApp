-- =============================================================================
-- VaibhavVivaahaApp — Plan Credential Test Accounts
-- 5 castes × 6 plans × 2 genders = 60 specific accounts
--
-- LOGIN: mobile (below) + PIN 1234
-- memberId format: PLN{casteId}{planId}{M|F}
-- Mobile format:   91{casteId}{planId}000001 (male) / 91{casteId}{planId}000002 (female)
--
-- All accounts: userStatus = APPROVED, isBlocked = N, pin = MTIzNA== (base64 of "1234")
-- isUser: FA for Free plan, PU for Starter–Platinum
-- =============================================================================

USE uravugal;

-- Disable safe-update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: a single procedure creates one male + one female for given caste+plan
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_upsert_credential;

DELIMITER $$

CREATE PROCEDURE sp_upsert_credential(
    IN p_caste_id   INT,       -- 1=VANNIYAR 2=NAIDU 3=AADITRAVIDAR 4=MUDALIAR 5=FREECASTEBAR
    IN p_plan_id    INT,       -- 1=Free 2=Starter 3=Classic 4=Silver 5=Gold 6=Platinum
    IN p_plan_title VARCHAR(20),
    IN p_days       INT,       -- subscription duration days (0 = no subscription row)
    IN p_credits    INT        -- boost_credits (Gold=2, Platinum=5, else 0)
)
BEGIN
    DECLARE v_caste_name  VARCHAR(30);
    DECLARE v_plan_short  VARCHAR(10);
    DECLARE v_mobile_m    VARCHAR(20);
    DECLARE v_mobile_f    VARCHAR(20);
    DECLARE v_member_m    VARCHAR(20);
    DECLARE v_member_f    VARCHAR(20);
    DECLARE v_is_user     VARCHAR(5);
    DECLARE v_user_id_m   BIGINT DEFAULT 0;
    DECLARE v_user_id_f   BIGINT DEFAULT 0;

    -- Caste display name
    SET v_caste_name = ELT(p_caste_id, 'Vann', 'Naidu', 'Aadi', 'Mudal', 'Free');
    -- Plan short label
    SET v_plan_short = ELT(p_plan_id, 'Free', 'Strt', 'Clsc', 'Slvr', 'Gold', 'Plat');

    SET v_mobile_m = CONCAT('91', p_caste_id, p_plan_id, '000001');
    SET v_mobile_f = CONCAT('91', p_caste_id, p_plan_id, '000002');
    SET v_member_m = CONCAT('PLN', p_caste_id, p_plan_id, 'M');
    SET v_member_f = CONCAT('PLN', p_caste_id, p_plan_id, 'F');
    SET v_is_user  = IF(p_plan_id = 1, 'FA', 'PU');

    -- ── MALE USER ──────────────────────────────────────────────────────────
    IF (SELECT COUNT(*) FROM users WHERE mobile = v_mobile_m) = 0 THEN
        INSERT INTO users (
            createdAt, createdBy, isActive,
            memberId, firstName, lastName,
            email, mobile, pin,
            gender, dob, age, casteId, location,
            userStatus, isBlocked, isUser, isOnline, profileCreated, view_count
        ) VALUES (
            NOW(), 'test-seed', 'Y',
            v_member_m,
            CONCAT(v_caste_name, p_plan_title),
            'TestMale',
            CONCAT('tst', p_caste_id, p_plan_id, 'm@vvm.test'),
            v_mobile_m, 'MTIzNA==',
            'M', '1995-06-15', '29', p_caste_id, 'Chennai',
            'APPROVED', 'N', v_is_user, 0, 'Y', 0
        );
        SET v_user_id_m = LAST_INSERT_ID();

        INSERT INTO user_details (
            createdAt, createdBy, isActive, userId,
            height, weight, occupation, annualIncome, degree,
            employedAt, jobPlace, connectionCount, visitCount, interestCount,
            about, aboutFamily, permanentAddress, presentAddress,
            basicInfo, familyInfo, astroInfo
        ) VALUES (
            NOW(), 'test-seed', 'Y', v_user_id_m,
            '5''10"', '70 kg', 'Software Engineer', '10-15L', 'B.Tech',
            'PRIVATE', 'Chennai', 0, 0, 0,
            CONCAT('Test account: ', v_caste_name, ' ', p_plan_title, ' Male. PIN=1234'),
            'Middle class family.',
            'Chennai', 'Chennai',
            JSON_OBJECT('marital_status','Never Married','place_of_birth','CHENNAI','mother_language','Tamil','physical_status','Normal','number_of_children',''),
            JSON_ARRAY(JSON_OBJECT('house','OWN HOUSE','father','TestFather','mother','TestMother','family_type','Traditional','no_of_sister','1','family_status','Middle Class','no_of_brother','1','brother_sister',NULL,'no_of_siblings','2','sister_married','0','brother_married','0','father_occupation','Business','mother_occupation','House Wife')),
            JSON_ARRAY(JSON_OBJECT('star','Aswini','dosham','None','sun_sign','None','moon_sign','Mesham'))
        );
    ELSE
        SELECT userId INTO v_user_id_m FROM users WHERE mobile = v_mobile_m LIMIT 1;
    END IF;

    -- ── FEMALE USER ────────────────────────────────────────────────────────
    IF (SELECT COUNT(*) FROM users WHERE mobile = v_mobile_f) = 0 THEN
        INSERT INTO users (
            createdAt, createdBy, isActive,
            memberId, firstName, lastName,
            email, mobile, pin,
            gender, dob, age, casteId, location,
            userStatus, isBlocked, isUser, isOnline, profileCreated, view_count
        ) VALUES (
            NOW(), 'test-seed', 'Y',
            v_member_f,
            CONCAT(v_caste_name, p_plan_title),
            'TestFemale',
            CONCAT('tst', p_caste_id, p_plan_id, 'f@vvm.test'),
            v_mobile_f, 'MTIzNA==',
            'F', '1997-03-20', '28', p_caste_id, 'Chennai',
            'APPROVED', 'N', v_is_user, 0, 'Y', 0
        );
        SET v_user_id_f = LAST_INSERT_ID();

        INSERT INTO user_details (
            createdAt, createdBy, isActive, userId,
            height, weight, occupation, annualIncome, degree,
            employedAt, jobPlace, connectionCount, visitCount, interestCount,
            about, aboutFamily, permanentAddress, presentAddress,
            basicInfo, familyInfo, astroInfo
        ) VALUES (
            NOW(), 'test-seed', 'Y', v_user_id_f,
            '5''4"', '55 kg', 'Teacher', '5-7L', 'M.Sc',
            'GOVT', 'Chennai', 0, 0, 0,
            CONCAT('Test account: ', v_caste_name, ' ', p_plan_title, ' Female. PIN=1234'),
            'Middle class family.',
            'Chennai', 'Chennai',
            JSON_OBJECT('marital_status','Never Married','place_of_birth','CHENNAI','mother_language','Tamil','physical_status','Normal','number_of_children',''),
            JSON_ARRAY(JSON_OBJECT('house','OWN HOUSE','father','TestFather','mother','TestMother','family_type','Traditional','no_of_sister','1','family_status','Middle Class','no_of_brother','0','brother_sister',NULL,'no_of_siblings','1','sister_married','0','brother_married','0','father_occupation','Govt','mother_occupation','House Wife')),
            JSON_ARRAY(JSON_OBJECT('star','Rohini','dosham','None','sun_sign','None','moon_sign','Rishabam'))
        );
    ELSE
        SELECT userId INTO v_user_id_f FROM users WHERE mobile = v_mobile_f LIMIT 1;
    END IF;

    -- ── SUBSCRIPTIONS (plans 2–6 only) ─────────────────────────────────────
    IF p_plan_id > 1 THEN
        -- Male subscription
        IF v_user_id_m > 0 AND (SELECT COUNT(*) FROM user_subscriptions WHERE userId = v_user_id_m AND status = 'ACTIVE') = 0 THEN
            INSERT INTO user_subscriptions (
                createdAt, createdBy, isActive,
                userId, subscriptionPlanId, status,
                startDate, endDate, autoRenew, boost_credits
            ) VALUES (
                NOW(), 'test-seed', 'Y',
                v_user_id_m, p_plan_id, 'ACTIVE',
                CURDATE(), DATE_ADD(CURDATE(), INTERVAL p_days DAY),
                'N', p_credits
            );
        END IF;

        -- Female subscription
        IF v_user_id_f > 0 AND (SELECT COUNT(*) FROM user_subscriptions WHERE userId = v_user_id_f AND status = 'ACTIVE') = 0 THEN
            INSERT INTO user_subscriptions (
                createdAt, createdBy, isActive,
                userId, subscriptionPlanId, status,
                startDate, endDate, autoRenew, boost_credits
            ) VALUES (
                NOW(), 'test-seed', 'Y',
                v_user_id_f, p_plan_id, 'ACTIVE',
                CURDATE(), DATE_ADD(CURDATE(), INTERVAL p_days DAY),
                'N', p_credits
            );
        END IF;
    END IF;

END$$

DELIMITER ;

-- =============================================================================
-- EXECUTE: 5 castes × 6 plans = 30 calls × 2 genders each = 60 accounts
-- Args: (casteId, planId, planTitle, durationDays, boostCredits)
-- =============================================================================

-- ── VANNIYAR (casteId=1) ─────────────────────────────────────────────────────
SELECT 'Creating VANNIYAR credentials...' AS status;
CALL sp_upsert_credential(1, 1, 'Free',     0,    0);
CALL sp_upsert_credential(1, 2, 'Starter',  30,   0);
CALL sp_upsert_credential(1, 3, 'Classic',  90,   0);
CALL sp_upsert_credential(1, 4, 'Silver',   90,   0);
CALL sp_upsert_credential(1, 5, 'Gold',     180,  2);
CALL sp_upsert_credential(1, 6, 'Platinum', 9999, 5);

-- ── NAIDU (casteId=2) ────────────────────────────────────────────────────────
SELECT 'Creating NAIDU credentials...' AS status;
CALL sp_upsert_credential(2, 1, 'Free',     0,    0);
CALL sp_upsert_credential(2, 2, 'Starter',  30,   0);
CALL sp_upsert_credential(2, 3, 'Classic',  90,   0);
CALL sp_upsert_credential(2, 4, 'Silver',   90,   0);
CALL sp_upsert_credential(2, 5, 'Gold',     180,  2);
CALL sp_upsert_credential(2, 6, 'Platinum', 9999, 5);

-- ── AADITRAVIDAR (casteId=3) ─────────────────────────────────────────────────
SELECT 'Creating AADITRAVIDAR credentials...' AS status;
CALL sp_upsert_credential(3, 1, 'Free',     0,    0);
CALL sp_upsert_credential(3, 2, 'Starter',  30,   0);
CALL sp_upsert_credential(3, 3, 'Classic',  90,   0);
CALL sp_upsert_credential(3, 4, 'Silver',   90,   0);
CALL sp_upsert_credential(3, 5, 'Gold',     180,  2);
CALL sp_upsert_credential(3, 6, 'Platinum', 9999, 5);

-- ── MUDALIAR (casteId=4) ─────────────────────────────────────────────────────
SELECT 'Creating MUDALIAR credentials...' AS status;
CALL sp_upsert_credential(4, 1, 'Free',     0,    0);
CALL sp_upsert_credential(4, 2, 'Starter',  30,   0);
CALL sp_upsert_credential(4, 3, 'Classic',  90,   0);
CALL sp_upsert_credential(4, 4, 'Silver',   90,   0);
CALL sp_upsert_credential(4, 5, 'Gold',     180,  2);
CALL sp_upsert_credential(4, 6, 'Platinum', 9999, 5);

-- ── FREECASTEBAR (casteId=5) ─────────────────────────────────────────────────
SELECT 'Creating FREECASTEBAR credentials...' AS status;
CALL sp_upsert_credential(5, 1, 'Free',     0,    0);
CALL sp_upsert_credential(5, 2, 'Starter',  30,   0);
CALL sp_upsert_credential(5, 3, 'Classic',  90,   0);
CALL sp_upsert_credential(5, 4, 'Silver',   90,   0);
CALL sp_upsert_credential(5, 5, 'Gold',     180,  2);
CALL sp_upsert_credential(5, 6, 'Platinum', 9999, 5);

-- Cleanup
DROP PROCEDURE IF EXISTS sp_upsert_credential;

-- =============================================================================
-- VERIFICATION — Credential summary
-- =============================================================================
SELECT
    u.mobile,
    u.memberId,
    CONCAT(u.firstName, ' ', u.lastName) AS name,
    u.gender,
    c.casteName,
    COALESCE(sp.title, 'Free (no sub)') AS plan,
    us.endDate                           AS sub_ends
FROM users u
JOIN castes c ON u.casteId = c.id
LEFT JOIN user_subscriptions us ON u.userId = us.userId AND us.status = 'ACTIVE'
LEFT JOIN subscription_plans sp ON us.subscriptionPlanId = sp.id
WHERE u.createdBy = 'test-seed'
  AND u.memberId LIKE 'PLN%'
ORDER BY c.id, sp.id, u.gender;
