# MediTrack ER Diagram Specification

## Entities and Attributes

### 1. User Entity
- **Primary Key**: userId (string)
- **Attributes**:
  - userId: string (PK)
  - name: string (NOT NULL)
  - email: string (NOT NULL, UNIQUE)
  - phone: string (NOT NULL)
  - createdAt: timestamp
  - updatedAt: timestamp

### 2. Patient Entity
- **Primary Key**: patientId (string)
- **Foreign Key**: userId (references User.userId)
- **Attributes**:
  - patientId: string (PK)
  - userId: string (FK, UNIQUE) → References User.userId
  - name: string (NOT NULL)
  - email: string (NOT NULL)
  - phone: string (NOT NULL)
  - birthDate: date (NOT NULL)
  - gender: enum('male', 'female', 'other') (NOT NULL)
  - address: string (NOT NULL)
  - occupation: string (NOT NULL)
  - emergencyContactName: string (NOT NULL)
  - emergencyContactNumber: string (NOT NULL)
  - primaryPhysician: string (NOT NULL)
  - insuranceProvider: string (NOT NULL)
  - insurancePolicyNumber: string (NOT NULL)
  - allergies: text (NULLABLE)
  - currentMedication: text (NULLABLE)
  - familyMedicalHistory: text (NULLABLE)
  - pastMedicalHistory: text (NULLABLE)
  - identificationType: string (NULLABLE)
  - identificationNumber: string (NULLABLE)
  - identificationDocumentId: string (NULLABLE)
  - identificationDocumentUrl: string (NULLABLE)
  - treatmentConsent: boolean (NOT NULL, DEFAULT: false)
  - disclosureConsent: boolean (NOT NULL, DEFAULT: false)
  - privacyConsent: boolean (NOT NULL, DEFAULT: false)
  - createdAt: timestamp
  - updatedAt: timestamp

### 3. Appointment Entity
- **Primary Key**: appointmentId (string)
- **Foreign Keys**: 
  - userId (references User.userId)
  - patientId (references Patient.patientId)
- **Attributes**:
  - appointmentId: string (PK)
  - userId: string (FK) → References User.userId
  - patientId: string (FK) → References Patient.patientId
  - primaryPhysician: string (NOT NULL)
  - schedule: datetime (NOT NULL)
  - reason: string (NOT NULL)
  - status: enum('pending', 'scheduled', 'cancelled') (NOT NULL, DEFAULT: 'pending')
  - note: text (NULLABLE)
  - cancellationReason: text (NULLABLE)
  - createdAt: timestamp
  - updatedAt: timestamp

### 4. Doctor Entity (Implied from constants)
- **Primary Key**: doctorId (string)
- **Attributes**:
  - doctorId: string (PK)
  - name: string (NOT NULL)
  - image: string (NULLABLE)
  - specialization: string (NULLABLE)
  - isActive: boolean (NOT NULL, DEFAULT: true)

## Relationships

### 1. User ↔ Patient (One-to-One)
- **Relationship**: Each User has exactly one Patient profile
- **Cardinality**: 1:1
- **Foreign Key**: Patient.userId → User.userId
- **Constraint**: CASCADE DELETE (if User is deleted, Patient is deleted)

### 2. User ↔ Appointment (One-to-Many)
- **Relationship**: Each User can have multiple Appointments
- **Cardinality**: 1:N
- **Foreign Key**: Appointment.userId → User.userId
- **Constraint**: CASCADE DELETE (if User is deleted, all Appointments are deleted)

### 3. Patient ↔ Appointment (One-to-Many)
- **Relationship**: Each Patient can have multiple Appointments
- **Cardinality**: 1:N
- **Foreign Key**: Appointment.patientId → Patient.patientId
- **Constraint**: CASCADE DELETE (if Patient is deleted, all Appointments are deleted)

### 4. Doctor ↔ Appointment (One-to-Many) - Implied
- **Relationship**: Each Doctor can have multiple Appointments (via primaryPhysician field)
- **Cardinality**: 1:N
- **Note**: Currently stored as string reference in primaryPhysician field

## Indexes (Recommended)
- User.email (UNIQUE)
- Patient.userId (UNIQUE)
- Patient.email
- Appointment.userId
- Appointment.patientId
- Appointment.schedule
- Appointment.status
- Appointment.primaryPhysician

## Business Rules
1. A User must have exactly one Patient profile
2. An Appointment must belong to both a User and a Patient
3. Patient consent fields (treatmentConsent, disclosureConsent, privacyConsent) must all be true for registration
4. Appointment status can only be 'pending', 'scheduled', or 'cancelled'
5. Gender can only be 'male', 'female', or 'other'
6. Phone numbers must follow international format (+[country code][number])
7. If an appointment is cancelled, cancellationReason must be provided

## Database Collections (Appwrite)
- **Users Collection**: Stores user authentication data
- **Patients Collection**: Stores detailed patient information
- **Appointments Collection**: Stores appointment data
- **Storage Bucket**: Stores identification documents

## Sample SQL DDL (if using SQL database)
```sql
-- Users table
CREATE TABLE Users (
    userId VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE Patients (
    patientId VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birthDate DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    address TEXT NOT NULL,
    occupation VARCHAR(255) NOT NULL,
    emergencyContactName VARCHAR(100) NOT NULL,
    emergencyContactNumber VARCHAR(20) NOT NULL,
    primaryPhysician VARCHAR(255) NOT NULL,
    insuranceProvider VARCHAR(255) NOT NULL,
    insurancePolicyNumber VARCHAR(255) NOT NULL,
    allergies TEXT,
    currentMedication TEXT,
    familyMedicalHistory TEXT,
    pastMedicalHistory TEXT,
    identificationType VARCHAR(100),
    identificationNumber VARCHAR(100),
    identificationDocumentId VARCHAR(255),
    identificationDocumentUrl TEXT,
    treatmentConsent BOOLEAN NOT NULL DEFAULT FALSE,
    disclosureConsent BOOLEAN NOT NULL DEFAULT FALSE,
    privacyConsent BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE Appointments (
    appointmentId VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    patientId VARCHAR(255) NOT NULL,
    primaryPhysician VARCHAR(255) NOT NULL,
    schedule DATETIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'scheduled', 'cancelled') NOT NULL DEFAULT 'pending',
    note TEXT,
    cancellationReason TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES Patients(patientId) ON DELETE CASCADE
);

-- Doctors table (optional - for future enhancement)
CREATE TABLE Doctors (
    doctorId VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    specialization VARCHAR(255),
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
