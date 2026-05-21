-- ============================================================
-- Gegeen — Product seed (24 products from prototype)
-- Extracted from /Users/marktech/Projects/Flowers/index.html line 10219-10331
-- ============================================================

insert into public.products
  (id, name, price, rating, reviews, badge, pet_safe, tags, occasion, img_seed, img_prompt)
values
  -- Signature flower bouquets
  ('the-saraa', 'The Saraa', 89000, 4.9, 7533, 'top-pick', true,
   ARRAY['bouquet','hand-tied','peony','rose','romance','pet-safe','bestseller','flowers','цэцэг','baglaa'],
   ARRAY['romance','birthday','just-because'],
   2001, 'pink peony and rose hand-tied bouquet wrapped in kraft paper on table, lifestyle photography, soft natural light, square composition'),

  ('the-anu', 'The Anu', 119000, 4.8, 4451, 'double-points', false,
   ARRAY['letterbox','tulip','sunflower','yellow','bestseller','flowers','цэцэг'],
   ARRAY['birthday','celebration','just-because'],
   2002, 'yellow tulip and sunflower bouquet in letterbox style delivery box, lifestyle photography, soft natural light, square composition'),

  ('the-tuya', 'The Tuya', 169000, 4.9, 1127, 'new-pill', false,
   ARRAY['premium','anemone','luxury','mystery','new','flowers','цэцэг'],
   ARRAY['mystery','romance','anniversary'],
   2003, 'deep burgundy purple anemone luxury bouquet in dark vase, moody lifestyle photography, square composition'),

  ('the-nomin', 'The Nomin', 229000, 4.9, 3008, 'letterbox-pill', true,
   ARRAY['premium','eucalyptus','sage','calm','pet-safe','letterbox','flowers','цэцэг'],
   ARRAY['calm','sympathy','celebration'],
   2004, 'elegant white sage eucalyptus bouquet in ceramic vase, soft lifestyle photography, square composition'),

  -- Peonies
  ('pink-peony-garden', 'Pink Peony Garden', 159000, 4.9, 892, 'top-pick', false,
   ARRAY['peony','romance','pink','hand-tied','spring','flowers','цэцэг','пион'],
   ARRAY['romance','birthday','anniversary','spring'],
   2005, 'lush pink peonies bouquet in glass vase on table, lifestyle photography, soft natural light, square composition'),

  ('white-peony', 'White Peony Whisper', 179000, 4.8, 445, null, false,
   ARRAY['peony','white','elegant','wedding','luxury','flowers','цэцэг','пион'],
   ARRAY['celebration','wedding','anniversary'],
   2006, 'elegant white peonies bouquet in ceramic vase, lifestyle photography, soft cream background, square composition'),

  -- Letterbox
  ('pocket-pink', 'Pocket Pink', 69000, 4.7, 2104, 'letterbox-pill', true,
   ARRAY['letterbox','pink','peach','affordable','pet-safe','flowers','цэцэг'],
   ARRAY['just-because','birthday','romance'],
   2007, 'small pink peach flower delivery letterbox box opened on table, lifestyle photography, square composition'),

  ('pocket-sunshine', 'Pocket Sunshine', 59000, 4.6, 1834, 'letterbox-pill', false,
   ARRAY['letterbox','yellow','gold','affordable','sunflower','flowers','цэцэг'],
   ARRAY['birthday','just-because','celebration'],
   2008, 'yellow sunflower tulip letterbox delivery box with kraft paper, lifestyle photography, square composition'),

  ('pocket-sage', 'Pocket Sage', 79000, 4.8, 1245, 'letterbox-pill', true,
   ARRAY['letterbox','sage','eucalyptus','calm','pet-safe','flowers','цэцэг'],
   ARRAY['calm','sympathy','just-because'],
   2009, 'sage green eucalyptus and white flowers letterbox box, minimalist lifestyle photography, square composition'),

  -- Hampers
  ('tea-hamper', 'Afternoon Tea Set', 189000, 4.8, 567, null, false,
   ARRAY['hamper','tea','food','gift-set','хамтар','бэлэг'],
   ARRAY['birthday','just-because','sympathy'],
   2010, 'afternoon tea hamper basket with shortbread biscuits scones and small bouquet on wooden table, lifestyle photography, square composition'),

  ('chocolate-hamper', 'Chocolate Lovers Box', 159000, 4.9, 1212, 'new-pill', false,
   ARRAY['hamper','chocolate','food','gift-set','new','шоколад','бэлэг'],
   ARRAY['birthday','romance','just-because'],
   2011, 'luxury chocolate truffles gift box with pink flower bouquet on dark table, lifestyle photography, square composition'),

  ('wine-flowers', 'Wine & Flowers Duo', 219000, 4.7, 823, null, false,
   ARRAY['hamper','wine','gift-set','luxury','бэлэг'],
   ARRAY['celebration','anniversary','romance'],
   2012, 'red wine bottle with pink rose bouquet gift set on wooden tray, lifestyle photography, square composition'),

  -- Plants
  ('monstera-petite', 'Monstera Petite', 89000, 4.7, 892, null, false,
   ARRAY['plant','houseplant','green','low-maintenance','таримал'],
   ARRAY['housewarming','just-because','self-care'],
   2013, 'small monstera deliciosa plant in white ceramic pot on wooden shelf, modern interior, lifestyle photography, square composition'),

  ('orchid-elegance', 'Orchid Elegance', 129000, 4.8, 445, null, true,
   ARRAY['plant','orchid','elegant','pet-safe','luxury','таримал'],
   ARRAY['celebration','sympathy','housewarming'],
   2014, 'elegant white phalaenopsis orchid in tall ceramic pot on table, lifestyle photography, soft natural light, square composition'),

  ('succulent-trio', 'Succulent Trio', 69000, 4.6, 1567, null, true,
   ARRAY['plant','succulent','small','pet-safe','low-maintenance','таримал'],
   ARRAY['housewarming','just-because','self-care'],
   2015, 'three small succulent plants in white pots on wooden table, scandinavian interior, lifestyle photography, square composition'),

  -- Cards
  ('birthday-card', 'Birthday Joy Card', 14000, 4.9, 3334, null, false,
   ARRAY['card','birthday','colorful','greeting','карт'],
   ARRAY['birthday'],
   2016, 'colorful illustrated birthday greeting card with confetti on table, lifestyle photography, square composition'),

  ('thanks-card', 'Thank You Card', 12000, 4.8, 2102, null, false,
   ARRAY['card','thanks','minimal','greeting','карт'],
   ARRAY['gratitude','just-because'],
   2017, 'minimal thank you greeting card with small flower illustration on wooden table, lifestyle photography, square composition'),

  ('sympathy-card', 'With Sympathy', 14000, 4.9, 892, null, false,
   ARRAY['card','sympathy','calm','greeting','карт'],
   ARRAY['sympathy','apology'],
   2018, 'elegant sympathy card with white lily illustration on cream background, lifestyle photography, square composition'),

  -- Subscriptions
  ('petite-weekly', 'Petite Weekly', 89000, 4.9, 2233, null, true,
   ARRAY['subscription','weekly','affordable','pet-safe','захиалга'],
   ARRAY['weekly','self-care'],
   2019, 'weekly flower subscription delivery box with small bouquet on table, lifestyle photography, square composition'),

  ('signature-monthly', 'Signature Atelier', 169000, 4.9, 1556, 'top-pick', false,
   ARRAY['subscription','monthly','signature','premium','захиалга'],
   ARRAY['monthly','self-care','anniversary'],
   2020, 'monthly signature flower subscription box with pink peonies inside, lifestyle photography, square composition'),

  -- Additional variety
  ('spring-tulips', 'Spring Tulips', 79000, 4.7, 1567, null, true,
   ARRAY['tulip','spring','yellow','pet-safe','flowers','цэцэг','хаврын'],
   ARRAY['just-because','spring','birthday'],
   2021, 'yellow and pink tulip spring bouquet in glass vase, lifestyle photography, soft natural light, square composition'),

  ('pure-lily', 'Pure Lily', 139000, 4.8, 723, null, false,
   ARRAY['lily','white','elegant','sympathy','flowers','цэцэг'],
   ARRAY['sympathy','celebration','apology'],
   2022, 'pure white lily bouquet in ceramic vase on cream background, elegant lifestyle photography, square composition'),

  ('sunny-day', 'Sunny Day', 89000, 4.8, 1923, null, true,
   ARRAY['sunflower','yellow','cheerful','pet-safe','flowers','цэцэг','наран'],
   ARRAY['birthday','just-because','celebration'],
   2023, 'cheerful sunflowers bouquet in vase with warm sunlight, lifestyle photography, square composition'),

  ('lavender-calm', 'Lavender Calm', 109000, 4.7, 856, null, true,
   ARRAY['lavender','purple','calm','pet-safe','dried','flowers','цэцэг','хатсан'],
   ARRAY['calm','sympathy','self-care'],
   2024, 'lavender purple mixed bouquet in vase with dried elements, calm lifestyle photography, square composition')

on conflict (id) do update set
  name      = excluded.name,
  price     = excluded.price,
  rating    = excluded.rating,
  reviews   = excluded.reviews,
  badge     = excluded.badge,
  pet_safe  = excluded.pet_safe,
  tags      = excluded.tags,
  occasion  = excluded.occasion,
  img_seed  = excluded.img_seed,
  img_prompt = excluded.img_prompt;
