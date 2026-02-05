# Authentication

Defra ID authentication implements OAuth 2.0 / OpenID Connect with:

- Authorization Code Flow
- Refresh tokens for automatic token renewal
- Server-side session storage (Redis/Memory)
- CSRF protection via state parameter

When a new user signs in for the first time they'll be offered to enroll on the service (or the org they're an employee of).

## Defra ID

### Auth flows

Mermaid diagrams:

- [Sign in flow](./sign-in-flow.mermaid)
- [Sign out flow](./sign-out-flow.mermaid)
- TBC - Authenticated request to backend API

### Signing out

You can sign out from the profile page - http://localhost:3000/profile

## Defra ID stub

To use the stub:

1. use the default values in config.js, don't override with the values in .env
2. run `docker compose up --build -d` to run the defra ID stub plus all dependencies.
3. run `npm run dev` to start the frontend.

### When running the stub for the first time:

On the 'DEFRA ID Stub User Set Up' page:

1. Enter email, first name, last name
2. For Enrolments, enter 1
3. For Enrolment requests, enter 1

On the New User Relationships page:

1. Enter any value for Relationsip ID, Organisation ID and Organisation Name
2. Choose user type eg Citizen then click Add relationship
3. Scroll to the bottom of the next page and click Finish
4. Now instead of clicking Login on the next page, set the browser address to http://localhost:3000
5. Click Log in
