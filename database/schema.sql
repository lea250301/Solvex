CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    address TEXT NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    service_type VARCHAR(20) NOT NULL
        CHECK (service_type IN ('cleaning', 'electrical', 'installer'))
);

CREATE TABLE managers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL
);

CREATE TABLE solar_plants (
    id_solar_plants BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_customer BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    installation_address TEXT NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    installed_capacity_kw NUMERIC(10, 2)
        CHECK (installed_capacity_kw IS NULL OR installed_capacity_kw > 0),
    panel_count INTEGER
        CHECK (panel_count IS NULL OR panel_count > 0),
    has_battery BOOLEAN NOT NULL DEFAULT FALSE,
    battery_capacity_kwh NUMERIC(10, 2)
        CHECK (battery_capacity_kwh IS NULL OR battery_capacity_kwh > 0),
    installed_on DATE,
    CHECK (has_battery OR battery_capacity_kwh IS NULL),
    UNIQUE (id_customer, name)
);

CREATE TABLE services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_solar_plant BIGINT NOT NULL
        REFERENCES solar_plants(id_solar_plants) ON DELETE RESTRICT,
    id_service_request BIGINT,
    service_type VARCHAR(20) NOT NULL
        CHECK (service_type IN ('cleaning', 'electrical', 'installer')),
    id_employee BIGINT
        REFERENCES employees(id) ON DELETE RESTRICT,
    id_manager BIGINT
        REFERENCES managers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    FOREIGN KEY (id_service_request, id_solar_plant)
        REFERENCES service_requests(id, id_solar_plant) ON DELETE RESTRICT
);

CREATE TABLE service_reports (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_service BIGINT NOT NULL UNIQUE
        REFERENCES services(id) ON DELETE RESTRICT,
    id_employee BIGINT NOT NULL
        REFERENCES employees(id) ON DELETE RESTRICT,
    work_summary TEXT NOT NULL,
    findings TEXT,
    recommendations TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_solar_plant BIGINT NOT NULL
        REFERENCES solar_plants(id_solar_plants) ON DELETE RESTRICT,
    request_type VARCHAR(30) NOT NULL
        CHECK (request_type IN ('fault_report', 'regular_inspection')),
    description TEXT,
    preferred_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'reviewing', 'scheduled', 'completed', 'rejected', 'cancelled')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        request_type <> 'fault_report'
        OR NULLIF(BTRIM(description), '') IS NOT NULL
    ),
    UNIQUE (id, id_solar_plant)
);

