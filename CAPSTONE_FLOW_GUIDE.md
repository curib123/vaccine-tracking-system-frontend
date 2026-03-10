# Capstone Flow Guide

## Title

Health Center Vaccine Tracking System

## 1. System flow

1. User logs in.
2. System checks the role.
3. Admin goes to admin pages.
4. Parent goes to parent pages.
5. Admin sets up roles, users, parents, children, vaccines, visits, and records.
6. Parent views the final child immunization data.

## 2. Screen-by-screen explanation

### Login Screen

File:

- `src/app/login/page.tsx`

Explanation:

- This is the entry point of the system.
- The user enters email and password.
- The system validates the account.
- If the account is a parent account, it opens the parent side.
- If the account is an admin or staff account, it opens the admin side.

### Admin Dashboard

File:

- `src/app/admin/dashboard/page.tsx`

Explanation:

- This screen gives the admin a quick overview of the system.
- It shows total children, completion rate, overdue immunizations, and due vaccines.
- This is mainly for monitoring and summary reporting.

### Roles Management Screen

File:

- `src/app/admin/roles/page.tsx`

Explanation:

- This screen is used to create and manage roles.
- Roles define what users are allowed to access in the system.
- Example roles are admin, staff, nurse, and parent.
- This should be set first before creating user accounts.

### Users Management Screen

File:

- `src/app/admin/users/page.tsx`

Explanation:

- This screen is used to create and manage system users.
- The admin enters personal details, login details, and assigns a role.
- These users can then log in based on the permissions of their assigned role.

### Parents Management Screen

File:

- `src/app/admin/parents/page.tsx`

Explanation:

- This screen shows the list of parents in the system.
- The admin can view each parent’s children.
- The admin can also inspect a child’s immunization records under that parent.
- This screen helps verify parent-child relationships.

### Child Records Screen

File:

- `src/app/admin/children/page.tsx`

Explanation:

- This screen is used to register and manage children.
- Each child is linked to a parent or guardian.
- The admin enters the child’s personal details such as name, gender, birth date, and birth place.
- This screen is important because the child record is the basis for vaccine tracking.

### Add Vaccine Record Action

File:

- `src/app/admin/children/page.tsx`

Related modal:

- `src/components/modal/GenerateVaccineModal.tsx`

Explanation:

- This action is used after a child and vaccine already exist.
- The admin selects vaccines for the child.
- The system generates immunization records based on the vaccine schedule.
- These generated records are usually pending first.

### Vaccine Management Screen

File:

- `src/app/admin/vaccines/page.tsx`

Explanation:

- This screen is used to create and manage vaccines.
- The admin enters vaccine details such as vaccine name, description, recommended age, total doses, and booster settings.
- The admin also defines the dose schedules.
- These vaccine schedules are used later to generate child immunization records.

### Visits Screen

File:

- `src/app/admin/visits/page.tsx`

Explanation:

- This screen is used to create and manage actual clinic visits.
- A visit contains the child, date, location, and assigned nurse or user.
- This represents the real health center encounter.
- After a visit is created, vaccine records can be attached to it.

### Attach Records to Visit Action

File:

- `src/app/admin/visits/page.tsx`

Related modal:

- `src/components/modal/AttachRecordsModal.tsx`

Explanation:

- This action connects pending immunization records to the actual visit.
- The admin selects the child’s pending vaccine records.
- The admin marks the result as completed, skipped, or cancelled.
- This step finalizes what happened during the clinic visit.

### Immunization Records Screen

File:

- `src/app/admin/immunization/page.tsx`

Explanation:

- This screen displays all immunization records in the system.
- The admin can search and filter records by status.
- The admin can also open visit details connected to a record.
- This screen is used for tracking progress and reviewing vaccine history.

### Announcements Screen

File:

- `src/app/admin/announcement/page.tsx`

Explanation:

- This screen is used to create and manage announcements.
- Announcements are notices from the health center.
- These announcements become visible on the parent side.

### Parent Dashboard

File:

- `src/app/user/dashboard/page.tsx`

Explanation:

- This is the main landing page for the parent after login.
- It shows a summary of the children’s immunization progress.
- It helps the parent quickly check overall vaccine status.

### Parent Children Screen

File:

- `src/app/user/children/page.tsx`

Explanation:

- This screen shows all children linked to the logged-in parent.
- The parent can expand each child to view immunization records.
- The parent can see vaccine name, dose, date given, next due date, and status.
- This is the main result screen for the parent.

### Parent Announcements Screen

File:

- `src/app/user/announcements/page.tsx`

Explanation:

- This screen shows announcements published by the admin or health center.
- It helps parents stay updated with schedules, reminders, and advisories.

### Parent Profile Screen

File:

- `src/app/user/profile/page.tsx`

Explanation:

- This screen displays the parent’s account information.
- The parent can review details and logout from the system.

## 3. Data connection

The screens are connected through this data flow:

1. Role
2. User
3. Parent
4. Child
5. Vaccine
6. Vaccine Schedule
7. Immunization Record
8. Visit
9. Announcement

Simple explanation:

- A role is assigned to a user.
- A parent is linked to one or more children.
- A vaccine has schedules.
- Schedules are used to generate immunization records for a child.
- A visit is created when the child comes to the health center.
- Immunization records are attached to the visit.
- The completed information is shown to admin and parent users.

## 4. Best demo flow for capstone

1. Show the login screen.
2. Explain role checking and redirection.
3. Show role management.
4. Show user management.
5. Show parent management.
6. Show child registration.
7. Show vaccine management.
8. Show generating vaccine records for a child.
9. Show creating a visit.
10. Show attaching records to a visit.
11. Show immunization records monitoring.
12. Show announcements.
13. Login as parent.
14. Show parent dashboard.
15. Show parent children records.
16. Show parent announcements.
17. Show parent profile.

## 5. One-line defense explanation

This capstone system manages the full child immunization process by connecting account management, parent-child registration, vaccine scheduling, immunization record generation, clinic visit recording, and parent monitoring into one complete digital workflow.
