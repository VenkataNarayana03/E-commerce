# Ecommerce ER Diagram

```mermaid
erDiagram
    USERS ||--o{ CART_ITEMS : owns
    USERS ||--o{ ORDERS : places
    USERS ||--o{ ADDRESSES : saves
    USERS ||--o{ WISHLIST_ITEMS : saves
    USERS ||--o{ REVIEWS : writes
    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ CART_ITEMS : added_to
    PRODUCTS ||--o{ ORDER_ITEMS : purchased_as
    PRODUCTS ||--o{ WISHLIST_ITEMS : saved_in
    PRODUCTS ||--o{ REVIEWS : receives
    ORDERS ||--|{ ORDER_ITEMS : includes
    ORDERS ||--o| PAYMENTS : has

    USERS {
        int id PK
        string email UK
        string full_name
        string password_hash
        string role
        boolean is_active
        boolean is_blocked
        string profile_image_url
        datetime created_at
        datetime updated_at
    }

    ADDRESSES {
        int id PK
        int user_id FK
        string shipping_name
        string shipping_phone
        string shipping_address_line1
        string shipping_address_line2
        string shipping_city
        string shipping_state
        string shipping_postal_code
        string shipping_country
        boolean is_default
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        int id PK
        string name UK
        string slug UK
        text description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        int id PK
        int category_id FK
        string name
        string slug UK
        text description
        decimal price
        int stock_quantity
        string image_url
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        int id PK
        int user_id FK
        int product_id FK
        int quantity
        datetime created_at
        datetime updated_at
    }

    WISHLIST_ITEMS {
        int id PK
        int user_id FK
        int product_id FK
        datetime created_at
    }

    REVIEWS {
        int id PK
        int user_id FK
        int product_id FK
        int rating
        text comment
        datetime created_at
        datetime updated_at
    }

    ORDERS {
        int id PK
        int user_id FK
        string order_number UK
        string status
        string payment_method
        string shipping_name
        string shipping_phone
        string shipping_address_line1
        string shipping_address_line2
        string shipping_city
        string shipping_state
        string shipping_postal_code
        string shipping_country
        decimal subtotal
        decimal shipping_fee
        decimal total_amount
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        decimal unit_price
        int quantity
        decimal line_total
    }

    PAYMENTS {
        int id PK
        int order_id FK
        decimal amount
        string method
        string status
        string provider
        string transaction_id UK
        datetime paid_at
        datetime created_at
        datetime updated_at
    }
```

## Relationships

- One user can have many saved addresses, cart items, wishlist items, reviews, and orders.
- One category can contain many products.
- One product can appear in many carts, wishlist items, reviews, and order items.
- One order has many order items.
- One order has zero or one payment record.
