/*
  # Dados de Demonstração

  1. Dados Iniciais
    - Usuário administrador de demonstração
    - Usuário padrão de demonstração
    - Veículos de exemplo
    - Alertas de exemplo

  2. Observações
    - Senhas devem ser hash bcrypt em produção
    - Dados simplificados para demonstração
*/

-- Inserir usuário administrador
INSERT INTO users (email, password, name, role, active)
VALUES 
  ('admin@fleet.com', 'admin123', 'Administrador Sistema', 'MANAGER', true),
  ('user@fleet.com', 'user123', 'João Silva', 'USER', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir veículos e dados de exemplo
DO $$
DECLARE
  admin_id uuid;
  user_id uuid;
  vehicle1_id uuid;
  vehicle2_id uuid;
  vehicle3_id uuid;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@fleet.com' LIMIT 1;
  SELECT id INTO user_id FROM users WHERE email = 'user@fleet.com' LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Veículos do admin
    INSERT INTO vehicles (plate, brand, model, year, initial_mileage, current_mileage, acquisition_date, fuel_type, color, user_id)
    VALUES 
      ('ABC-1234', 'Toyota', 'Corolla', 2022, 0, 15000, '2022-01-15', 'FLEX', 'Prata', admin_id)
    ON CONFLICT (plate) DO NOTHING
    RETURNING id INTO vehicle1_id;

    IF vehicle1_id IS NULL THEN
      SELECT id INTO vehicle1_id FROM vehicles WHERE plate = 'ABC-1234' LIMIT 1;
    END IF;

    INSERT INTO vehicles (plate, brand, model, year, initial_mileage, current_mileage, acquisition_date, fuel_type, color, user_id)
    VALUES 
      ('XYZ-5678', 'Volkswagen', 'Gol', 2021, 0, 28000, '2021-06-20', 'FLEX', 'Branco', admin_id)
    ON CONFLICT (plate) DO NOTHING
    RETURNING id INTO vehicle2_id;

    IF vehicle2_id IS NULL THEN
      SELECT id INTO vehicle2_id FROM vehicles WHERE plate = 'XYZ-5678' LIMIT 1;
    END IF;

    IF vehicle1_id IS NOT NULL THEN
      -- Despesas de exemplo
      INSERT INTO expenses (date, category, amount, description, mileage, fuel_type, fuel_quantity, price_per_liter, vehicle_id, user_id)
      VALUES 
        (CURRENT_DATE - INTERVAL '5 days', 'FUEL', 250.00, 'Abastecimento Posto Shell', 14950, 'GASOLINA', 40, 6.25, vehicle1_id, admin_id),
        (CURRENT_DATE - INTERVAL '3 days', 'FUEL', 180.50, 'Abastecimento Posto BR', 15000, 'ETANOL', 35, 5.16, vehicle1_id, admin_id),
        (CURRENT_DATE - INTERVAL '30 days', 'MAINTENANCE_PREVENTIVE', 450.00, 'Troca de óleo e filtros', 14500, NULL, NULL, NULL, vehicle1_id, admin_id);

      -- Alertas de exemplo
      INSERT INTO alerts (title, message, severity, status, due_date, vehicle_id)
      VALUES 
        ('Manutenção Preventiva', 'Revisão dos 15.000 km está próxima', 'WARNING', 'PENDING', CURRENT_DATE + INTERVAL '7 days', vehicle1_id),
        ('Troca de Óleo', 'Última troca de óleo realizada há 5 meses', 'CRITICAL', 'PENDING', CURRENT_DATE + INTERVAL '2 days', vehicle1_id);
    END IF;

    IF vehicle2_id IS NOT NULL THEN
      INSERT INTO expenses (date, category, amount, description, vehicle_id, user_id)
      VALUES 
        (CURRENT_DATE - INTERVAL '10 days', 'FINE', 195.23, 'Multa por excesso de velocidade', vehicle2_id, admin_id);
    END IF;
  END IF;

  IF user_id IS NOT NULL THEN
    -- Veículos do usuário padrão
    INSERT INTO vehicles (plate, brand, model, year, initial_mileage, current_mileage, acquisition_date, fuel_type, color, user_id)
    VALUES 
      ('DEF-9012', 'Fiat', 'Uno', 2020, 0, 45000, '2020-03-10', 'FLEX', 'Vermelho', user_id)
    ON CONFLICT (plate) DO NOTHING
    RETURNING id INTO vehicle3_id;

    IF vehicle3_id IS NULL THEN
      SELECT id INTO vehicle3_id FROM vehicles WHERE plate = 'DEF-9012' LIMIT 1;
    END IF;

    IF vehicle3_id IS NOT NULL THEN
      -- Despesas do usuário
      INSERT INTO expenses (date, category, amount, description, mileage, fuel_type, fuel_quantity, price_per_liter, vehicle_id, user_id)
      VALUES 
        (CURRENT_DATE - INTERVAL '2 days', 'FUEL', 150.00, 'Abastecimento Posto Ipiranga', 45000, 'GASOLINA', 30, 5.00, vehicle3_id, user_id);

      -- Alertas do usuário
      INSERT INTO alerts (title, message, severity, status, vehicle_id)
      VALUES 
        ('Documentação', 'Renovação do licenciamento necessária', 'INFO', 'PENDING', vehicle3_id);
    END IF;
  END IF;
END $$;
