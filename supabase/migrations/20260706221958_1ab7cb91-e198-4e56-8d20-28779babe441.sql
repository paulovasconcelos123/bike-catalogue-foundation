
-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- SUBCATEGORIES
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
CREATE INDEX subcategories_category_id_idx ON public.subcategories(category_id);
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT TO anon, authenticated USING (true);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  price_cents INT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_id_idx ON public.products(category_id);
CREATE INDEX products_subcategory_id_idx ON public.products(subcategory_id);
CREATE INDEX products_featured_idx ON public.products(featured) WHERE featured;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  cover_url TEXT,
  excerpt TEXT NOT NULL DEFAULT '',
  external_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (true);

-- SEED CATEGORIES
INSERT INTO public.categories (slug, name, sort) VALUES
  ('bicicletas', 'Bicicletas', 1),
  ('pecas', 'Peças e Componentes', 2),
  ('acessorios', 'Acessórios', 3),
  ('vestuario', 'Vestuário', 4),
  ('servicos', 'Manutenção e Serviços', 5);

-- SEED SUBCATEGORIES
INSERT INTO public.subcategories (category_id, slug, name, sort)
SELECT c.id, sub.slug, sub.name, sub.sort
FROM public.categories c
JOIN (VALUES
  ('bicicletas','urbana','Urbana',1),
  ('bicicletas','mtb','MTB',2),
  ('bicicletas','speed','Speed / Estrada',3),
  ('bicicletas','infantil','Infantil',4),
  ('bicicletas','eletrica','Elétrica',5),
  ('pecas','freios','Freios',1),
  ('pecas','cambio','Câmbio',2),
  ('pecas','rodas','Rodas e Aros',3),
  ('pecas','pedais','Pedais',4),
  ('pecas','transmissao','Correntes e Transmissão',5),
  ('pecas','selins','Selins',6),
  ('acessorios','capacetes','Capacetes',1),
  ('acessorios','luzes','Luzes e Sinalização',2),
  ('acessorios','suportes','Suportes e Garrafas',3),
  ('acessorios','cadeados','Cadeados',4),
  ('acessorios','paralamas','Paralamas',5),
  ('vestuario','camisas','Camisas',1),
  ('vestuario','luvas','Luvas',2),
  ('vestuario','oculos','Óculos',3),
  ('servicos','revisao','Revisão',1),
  ('servicos','troca-pecas','Troca de peças',2),
  ('servicos','montagem','Montagem',3)
) AS sub(cat_slug, slug, name, sort) ON c.slug = sub.cat_slug;

-- SEED PRODUCTS
WITH cats AS (
  SELECT slug, id FROM public.categories
), subs AS (
  SELECT c.slug AS cat_slug, s.slug AS sub_slug, s.id
  FROM public.subcategories s JOIN public.categories c ON c.id = s.category_id
)
INSERT INTO public.products (slug, name, category_id, subcategory_id, price_cents, stock, description, images, featured)
VALUES
  ('urbana-classic-aro-26',
   'Bicicleta Urbana Classic Aro 26',
   (SELECT id FROM cats WHERE slug='bicicletas'),
   (SELECT id FROM subs WHERE cat_slug='bicicletas' AND sub_slug='urbana'),
   129900, 8,
   'Bicicleta urbana com quadro leve, garupa reforçada e câmbio de 6 marchas. Ideal para o dia a dia na cidade.',
   ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&q=80'],
   true),

  ('mtb-trail-aro-29',
   'MTB Trail Aro 29 21v',
   (SELECT id FROM cats WHERE slug='bicicletas'),
   (SELECT id FROM subs WHERE cat_slug='bicicletas' AND sub_slug='mtb'),
   249900, 5,
   'Mountain bike aro 29 com suspensão dianteira, freios a disco hidráulicos e câmbio de 21 velocidades.',
   ARRAY['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1200&q=80'],
   true),

  ('speed-road-carbon',
   'Speed Road Carbon',
   (SELECT id FROM cats WHERE slug='bicicletas'),
   (SELECT id FROM subs WHERE cat_slug='bicicletas' AND sub_slug='speed'),
   599900, 2,
   'Speed com quadro de fibra de carbono, guidão drop e grupo de transmissão 22v para quem leva pedal a sério.',
   ARRAY['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=80'],
   true),

  ('infantil-aro-16-vermelha',
   'Bicicleta Infantil Aro 16',
   (SELECT id FROM cats WHERE slug='bicicletas'),
   (SELECT id FROM subs WHERE cat_slug='bicicletas' AND sub_slug='infantil'),
   79900, 12,
   'Bike infantil aro 16 com rodinhas removíveis e freio traseiro contrapedal. Para crianças de 4 a 7 anos.',
   ARRAY['https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=1200&q=80'],
   true),

  ('eletrica-urban-e-500',
   'Elétrica Urban E-500',
   (SELECT id FROM cats WHERE slug='bicicletas'),
   (SELECT id FROM subs WHERE cat_slug='bicicletas' AND sub_slug='eletrica'),
   799900, 3,
   'Bicicleta elétrica com autonomia de até 60 km, motor de 500W e bateria removível.',
   ARRAY['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80'],
   true),

  ('freio-a-disco-hidraulico',
   'Freio a Disco Hidráulico (par)',
   (SELECT id FROM cats WHERE slug='pecas'),
   (SELECT id FROM subs WHERE cat_slug='pecas' AND sub_slug='freios'),
   45900, 15,
   'Kit completo com maneta, mangueira e pinça hidráulica dianteira e traseira.',
   ARRAY['https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1200&q=80'],
   true),

  ('capacete-mtb-ventilado',
   'Capacete MTB Ventilado',
   (SELECT id FROM cats WHERE slug='acessorios'),
   (SELECT id FROM subs WHERE cat_slug='acessorios' AND sub_slug='capacetes'),
   14900, 20,
   'Capacete leve, com regulagem por catraca e 18 entradas de ventilação. Certificado.',
   ARRAY['https://images.unsplash.com/photo-1591741535018-d042766c62eb?w=1200&q=80'],
   true),

  ('kit-luz-led-usb',
   'Kit Luz LED Recarregável USB',
   (SELECT id FROM cats WHERE slug='acessorios'),
   (SELECT id FROM subs WHERE cat_slug='acessorios' AND sub_slug='luzes'),
   7900, 30,
   'Farol dianteiro branco e lanterna traseira vermelha, recarga USB. Alta visibilidade.',
   ARRAY['https://images.unsplash.com/photo-1508007226346-fe1af52bff17?w=1200&q=80'],
   false),

  ('camisa-ciclismo-preta',
   'Camisa de Ciclismo Manga Curta',
   (SELECT id FROM cats WHERE slug='vestuario'),
   (SELECT id FROM subs WHERE cat_slug='vestuario' AND sub_slug='camisas'),
   12900, 18,
   'Camisa em tecido dry-fit, com bolsos traseiros e zíper full. Modelagem sport.',
   ARRAY['https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80'],
   false),

  ('revisao-completa',
   'Revisão Completa',
   (SELECT id FROM cats WHERE slug='servicos'),
   (SELECT id FROM subs WHERE cat_slug='servicos' AND sub_slug='revisao'),
   12000, 999,
   'Revisão completa da sua bike: regulagem de freios, câmbio, rodas, aperto de parafusos e lubrificação.',
   ARRAY['https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=1200&q=80'],
   false);

-- SEED BLOG POSTS
INSERT INTO public.blog_posts (slug, title, cover_url, excerpt, external_url, published_at) VALUES
  ('como-escolher-primeira-bike',
   'Como escolher a sua primeira bicicleta',
   'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&q=80',
   'Urbana, MTB ou speed? A gente te ajuda a escolher a bike certa pro seu perfil de pedal.',
   'https://instagram.com/paulobicicletas',
   now() - interval '5 days'),
  ('manutencao-basica-em-casa',
   'Manutenção básica que todo ciclista precisa saber',
   'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=1200&q=80',
   'Lubrificação de corrente, calibragem de pneus e ajuste de freio: passo a passo direto.',
   'https://tiktok.com/@paulobicicletas',
   now() - interval '20 days');
