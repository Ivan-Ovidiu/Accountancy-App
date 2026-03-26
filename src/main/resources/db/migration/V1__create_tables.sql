CREATE TABLE users (
                       id INT IDENTITY(1,1) PRIMARY KEY,
                       name NVARCHAR(100) NOT NULL,
                       email NVARCHAR(100) NOT NULL UNIQUE,
                       password_hash NVARCHAR(255) NOT NULL,
                       role NCHAR(10) NOT NULL DEFAULT 'viewer',
                       created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE clients (
                         id INT IDENTITY(1,1) PRIMARY KEY,
                         name NVARCHAR(100) NOT NULL,
                         email NVARCHAR(100),
                         phone NVARCHAR(20),
                         address NVARCHAR(255),
                         tax_id NVARCHAR(50),
                         created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE categories (
                            id INT IDENTITY(1,1) PRIMARY KEY,
                            name NVARCHAR(100) NOT NULL,
                            type NCHAR(10) NOT NULL
);

CREATE TABLE invoices (
                          id INT IDENTITY(1,1) PRIMARY KEY,
                          client_id INT NOT NULL FOREIGN KEY REFERENCES clients(id),
                          user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
                          invoice_number NVARCHAR(50) NOT NULL UNIQUE,
                          issue_date DATE NOT NULL,
                          due_date DATE NOT NULL,
                          subtotal DECIMAL(18,2) NOT NULL,
                          tax_rate DECIMAL(5,2) NOT NULL,
                          total DECIMAL(18,2) NOT NULL,
                          status NCHAR(10) NOT NULL DEFAULT 'draft',
                          created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE invoice_items (
                               id INT IDENTITY(1,1) PRIMARY KEY,
                               invoice_id INT NOT NULL FOREIGN KEY REFERENCES invoices(id),
                               description NVARCHAR(255) NOT NULL,
                               quantity INT NOT NULL,
                               unit_price DECIMAL(18,2) NOT NULL,
                               total DECIMAL(18,2) NOT NULL
);

CREATE TABLE expenses (
                          id INT IDENTITY(1,1) PRIMARY KEY,
                          user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
                          category_id INT NOT NULL FOREIGN KEY REFERENCES categories(id),
                          description NVARCHAR(255),
                          amount DECIMAL(18,2) NOT NULL,
                          expense_date DATE NOT NULL,
                          receipt_url NVARCHAR(255),
                          created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE transactions (
                              id INT IDENTITY(1,1) PRIMARY KEY,
                              user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
                              category_id INT FOREIGN KEY REFERENCES categories(id),
                              invoice_id INT FOREIGN KEY REFERENCES invoices(id),
                              expense_id INT FOREIGN KEY REFERENCES expenses(id),
                              type NCHAR(10) NOT NULL,
                              amount DECIMAL(18,2) NOT NULL,
                              description NVARCHAR(255),
                              transaction_date DATE NOT NULL,
                              created_at DATETIME DEFAULT GETDATE()
);