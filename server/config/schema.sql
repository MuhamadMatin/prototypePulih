CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(50) UNIQUE, 
    fullName VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL, -- Password is now required even for anonymous
    phone VARCHAR(50),
    bio TEXT,
    isAnonymous BOOLEAN DEFAULT FALSE,
    joinedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    streak INT DEFAULT 0,
    lastLogin DATETIME,
    lastStreakUpdate DATETIME
);

CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    messages JSON,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mood_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    moodLevel INT NOT NULL,
    note TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    aiFeedback TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Self Assessment Results (PHQ-9, GAD-7)
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    type ENUM('PHQ9', 'GAD7') NOT NULL,
    score INT NOT NULL,
    severity VARCHAR(50),
    answers JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- User Achievements (Gamification)
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    achievementType VARCHAR(50) NOT NULL,
    unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_achievement (userId, achievementType),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Safety Plan
CREATE TABLE IF NOT EXISTS safety_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL UNIQUE,
    warningSignals TEXT,
    copingStrategies TEXT,
    reasonsToLive TEXT,
    supportContacts JSON,
    safeEnvironmentSteps TEXT,
    professionalContacts JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Grounding Exercise Sessions
CREATE TABLE IF NOT EXISTS grounding_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

