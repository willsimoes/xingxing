-- Tarefas iniciais da casa.
-- Rotinas e a compra do filtro nascem para hoje. "Trocar filtros" fica bloqueada até a compra.
-- A validade do filtro começa em 60 dias: dá para mudar depois no app.
-- Pode rodar de novo: ids fixos e on conflict do nothing.

insert into public.comodos (id, nome, emoji, ordem) values
  ('11111111-1111-4111-8111-111111111101', 'Banheiro', '🚿', 1),
  ('11111111-1111-4111-8111-111111111102', 'Cozinha', '🍳', 2),
  ('11111111-1111-4111-8111-111111111103', 'Sala', '🛋️', 3),
  ('11111111-1111-4111-8111-111111111104', 'Geral', '🏠', 4)
on conflict (id) do nothing;

insert into public.tarefas (
  id, comodo_id, titulo, tipo, estrelinhas, frequencia, intervalo, proxima_data, status
) values
  ('22222222-2222-4222-8222-222222222101', '11111111-1111-4111-8111-111111111101', 'Limpar banheiro', 'rotina', 40, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222102', '11111111-1111-4111-8111-111111111101', 'Trocar lixo do banheiro', 'rotina', 10, 'n_vezes_por_semana', 2, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222103', '11111111-1111-4111-8111-111111111101', 'Lavar toalhas de mão', 'rotina', 15, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222104', '11111111-1111-4111-8111-111111111101', 'Lavar tapetes', 'rotina', 20, 'quinzenal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222105', '11111111-1111-4111-8111-111111111101', 'Consertar vazamentos nos rejuntes', 'missao', 80, 'nenhuma', null, null, 'ativa'),

  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 'Limpar a cozinha', 'rotina', 40, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 'Limpar pia', 'rotina', 10, 'diaria', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111102', 'Trocar lixo da cozinha', 'rotina', 10, 'a_cada_n_dias', 2, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111102', 'Lavar panos de prato', 'rotina', 15, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111102', 'Lavar garrafas d''água', 'rotina', 10, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111102', 'Limpar geladeira e recolher lixos que acumulam', 'rotina', 30, 'quinzenal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222207', '11111111-1111-4111-8111-111111111102', 'Lavar lixeira', 'rotina', 25, 'mensal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222209', '11111111-1111-4111-8111-111111111102', 'Trocar filtros', 'rotina', 20, 'validade', 60, null, 'bloqueada'),
  ('22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111102', 'Procurar limpeza profissional da máquina de lavar', 'missao', 30, 'nenhuma', null, null, 'ativa'),

  ('22222222-2222-4222-8222-222222222301', '11111111-1111-4111-8111-111111111103', 'Limpar a sala', 'rotina', 30, 'semanal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222302', '11111111-1111-4111-8111-111111111103', 'Trocar água das plantas e regá-las', 'rotina', 10, 'n_vezes_por_semana', 2, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222303', '11111111-1111-4111-8111-111111111103', 'Lavar capas de almofada', 'rotina', 20, 'mensal', null, current_date, 'ativa'),

  ('22222222-2222-4222-8222-222222222401', '11111111-1111-4111-8111-111111111104', 'Limpar capacho da entrada', 'rotina', 10, 'quinzenal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222402', '11111111-1111-4111-8111-111111111104', 'Limpar aspirador de pó', 'rotina', 20, 'mensal', null, current_date, 'ativa'),
  ('22222222-2222-4222-8222-222222222403', '11111111-1111-4111-8111-111111111104', 'Colar rodapés e outras coisas soltando', 'missao', 50, 'nenhuma', null, null, 'ativa'),
  ('22222222-2222-4222-8222-222222222404', '11111111-1111-4111-8111-111111111104', 'Chamar montador para aparafusar cadeiras da sala', 'missao', 30, 'nenhuma', null, null, 'ativa'),
  ('22222222-2222-4222-8222-222222222405', '11111111-1111-4111-8111-111111111104', 'Móvel para cantinho do café + micro-ondas + airfryer', 'missao', 60, 'nenhuma', null, null, 'ativa')
on conflict (id) do nothing;

insert into public.tarefas (
  id, comodo_id, titulo, tipo, estrelinhas, frequencia, intervalo, proxima_data, status, libera_tarefa_id
) values (
  '22222222-2222-4222-8222-222222222208',
  '11111111-1111-4111-8111-111111111102',
  'Comprar filtro',
  'compra',
  15,
  'nenhuma',
  null,
  current_date,
  'ativa',
  '22222222-2222-4222-8222-222222222209'
)
on conflict (id) do nothing;

insert into public.etapas (id, tarefa_id, titulo, ordem) values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222405', 'Medir o espaço', 1),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222405', 'Pesquisar opções', 2),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222405', 'Comprar o móvel', 3),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222405', 'Montar', 4)
on conflict (id) do nothing;
