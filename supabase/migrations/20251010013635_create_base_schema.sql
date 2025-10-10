/*
  # Sistema de Gestão de Frotas - Schema Base

  1. Novas Tabelas
    - `users` - Usuários do sistema (colaboradores e gestores)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text, hash bcrypt)
      - `name` (text)
      - `role` (text) - USER, MANAGER, ADMIN
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `vehicles` - Veículos da frota
      - `id` (uuid, primary key)
      - `plate` (text, unique)
      - `brand` (text)
      - `model` (text)
      - `year` (int)
      - `initial_mileage` (numeric)
      - `current_mileage` (numeric)
      - `acquisition_date` (date)
      - `chassis` (text, optional)
      - `renavam` (text, optional)
      - `color` (text, optional)
      - `fuel_type` (text, optional)
      - `tank_capacity` (numeric, optional)
      - `photo_url` (text, optional)
      - `active` (boolean)
      - `user_id` (uuid, foreign key)

    - `maintenance_configs` - Configurações de manutenção preventiva
      - `id` (uuid, primary key)
      - `maintenance_type` (text)
      - `interval_km` (numeric, optional)
      - `interval_days` (int, optional)
      - `last_mileage` (numeric, optional)
      - `last_date` (date, optional)
      - `vehicle_id` (uuid, foreign key)

    - `expenses` - Despesas dos veículos
      - `id` (uuid, primary key)
      - `date` (date)
      - `category` (text) - FUEL, MAINTENANCE_PREVENTIVE, MAINTENANCE_CORRECTIVE, FINE, TOLL_PARKING, INSURANCE_TAXES, OTHER
      - `amount` (numeric)
      - `description` (text, optional)
      - `mileage` (numeric, optional)
      - `fuel_type` (text, optional)
      - `fuel_quantity` (numeric, optional)
      - `price_per_liter` (numeric, optional)
      - `service_name` (text, optional)
      - `provider` (text, optional)
      - `invoice_url` (text, optional)
      - `vehicle_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)

    - `alerts` - Alertas de manutenção
      - `id` (uuid, primary key)
      - `title` (text)
      - `message` (text)
      - `severity` (text) - INFO, WARNING, CRITICAL
      - `status` (text) - PENDING, VIEWED, RESOLVED
      - `due_date` (date, optional)
      - `due_mileage` (numeric, optional)
      - `viewed_at` (timestamptz, optional)
      - `resolved_at` (timestamptz, optional)
      - `vehicle_id` (uuid, foreign key)

    - `audit_logs` - Logs de auditoria
      - `id` (uuid, primary key)
      - `action` (text)
      - `entity` (text)
      - `entity_id` (text)
      - `old_data` (jsonb, optional)
      - `new_data` (jsonb, optional)
      - `ip_address` (text, optional)
      - `user_id` (uuid, foreign key)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas restritivas baseadas em role e ownership
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MANAGER', 'ADMIN')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  initial_mileage numeric NOT NULL DEFAULT 0,
  current_mileage numeric NOT NULL DEFAULT 0,
  acquisition_date date NOT NULL,
  chassis text,
  renavam text,
  color text,
  fuel_type text,
  tank_capacity numeric,
  photo_url text,
  active boolean DEFAULT true,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de configurações de manutenção
CREATE TABLE IF NOT EXISTS maintenance_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_type text NOT NULL,
  interval_km numeric,
  interval_days int,
  last_mileage numeric,
  last_date date,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('FUEL', 'MAINTENANCE_PREVENTIVE', 'MAINTENANCE_CORRECTIVE', 'FINE', 'TOLL_PARKING', 'INSURANCE_TAXES', 'OTHER')),
  amount numeric NOT NULL,
  description text,
  mileage numeric,
  fuel_type text,
  fuel_quantity numeric,
  price_per_liter numeric,
  service_name text,
  provider text,
  invoice_url text,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VIEWED', 'RESOLVED')),
  due_date date,
  due_mileage numeric,
  viewed_at timestamptz,
  resolved_at timestamptz,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Managers can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

-- Políticas para vehicles
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update all vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can delete all vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

-- Políticas para maintenance_configs
CREATE POLICY "Users can view own vehicle maintenance configs"
  ON maintenance_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = maintenance_configs.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all maintenance configs"
  ON maintenance_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can manage own vehicle maintenance configs"
  ON maintenance_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = maintenance_configs.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage all maintenance configs"
  ON maintenance_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

-- Políticas para expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update all expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can delete all expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

-- Políticas para alerts
CREATE POLICY "Users can view own vehicle alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = alerts.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own vehicle alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = alerts.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update all alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

-- Políticas para audit_logs
CREATE POLICY "Only managers can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
