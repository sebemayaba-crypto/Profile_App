```mermaid
flowchart LR
    A[Frontend<br>HTML, CSS, JavaScript] -->|HTTP Requests| B[Backend<br>Node.js + Express.js]

    B -->|Read / Write Data| C[(MongoDB Database)]

    B -->|Password Hashing| D[bcryptjs]
    B -->|Token Creation and Verification| E[JWT]

    A -->|Stores Token| F[Browser LocalStorage]