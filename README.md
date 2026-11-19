# SWOJ — lokalny marketplace usług (MVP, województwo śląskie)

> „Znajdź sprawdzonego człowieka do każdej usługi.”

Первая рабочая версия маркетплейса локальных услуг. Главный объект — **человек и его профиль**
(CV + portfolio + wizytówka + cennik + booking), услуги — часть профиля.
Интерфейс полностью на польском, код и техническая документация — на английском/русском.

---

## Быстрый старт

```bash
npm install
npm run dev
# http://localhost:3000
```

Требуется Node.js ≥ 20.9. Файл `.env` не обязателен: без него приложение работает на встроенных демо-данных.

Другие команды:

| Команда | Что делает |
|---|---|
| `npm run build && npm start` | production-сборка и запуск |
| `npm run typecheck` | проверка TypeScript |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run db:seed:generate` | экспорт демо-данных в `supabase/seed.sql` |

### Демо-аккаунты

Пароль для всех: **`demo1234`** (подсказки есть прямо на странице `/logowanie`).

| E-mail | Роль | Куда попадает |
|---|---|---|
| `wykonawca@swoj.pl` | specjalista (Marek Kowalski, elektryk) | `/panel` |
| `admin@swoj.pl` | administrator | `/admin` |
| `klient@swoj.pl` | klient | `/konto` |

---

## Что работает

| Маршрут | Описание |
|---|---|
| `/` | Главная: hero с поиском „Czego potrzebujesz? / Gdzie?”, категории, рекомендуемые специалисты, города Śląska, „Jak to działa?”, „Dlaczego SWOJ?”, CTA для исполнителей |
| `/uslugi` | Поиск: свободный текст + город/индекс, фильтры (kategoria, lokalizacja, odległość, cena, ocena, dostępność, zweryfikowani, typ wykonawcy), 4 сортировки, пагинация. Всё в GET-параметрах — ссылки можно шарить, работает без JS |
| `/specjalisci` | Все специалисты |
| `/kategoria/[category]` | Страница категории по всему Śląsku |
| `/[city]` | Страница города (`/katowice`) |
| `/[city]/[category]` | SEO-лендинг (`/katowice/elektryk` → „Elektrycy w Katowicach”): специалисты, рейтинг, цены, FAQ, CTA, перелинковка |
| `/specjalista/[slug]` | Полный профиль: O mnie, Doświadczenie, Umiejętności, Certyfikaty, Usługi, Cennik, Portfolio, Opinie, Dostępność, Obszar działania (схематичная карта), Informacje o wykonawcy |
| `/specjalista/[slug]/rezerwacja` | Бронирование в 5 шагов → „Rezerwacja została wysłana.” |
| `/zlecenie` | Заявка на нестандартную задачу (с фото, бюджетом, датой, автоподбором категории по описанию) |
| `/zaloz-profil` | Onboarding исполнителя, 10 шагов |
| `/panel/*` | Кабинет исполнителя: Dashboard, Profil, Usługi, Kalendarz, Zlecenia, Rezerwacje, Opinie, Portfolio, Ustawienia |
| `/admin/*` | Админка: статистика, Użytkownicy, Specjaliści, Usługi, Rezerwacje, Zlecenia, Opinie, Zgłoszenia, Weryfikacja, Kategorie, Miasta |
| `/cennik` | Тарифы Free / PRO 49 zł / PRO+ 99 zł + прочие сборы |
| `/jak-to-dziala`, `/dla-wykonawcow`, `/logowanie`, `/konto` | Информационные и служебные страницы |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | SEO |

„AI”-поиск: введите фразу вроде *„Cieknie mi woda pod zlewem i potrzebuję kogoś jutro rano”* —
система определит категорию (hydraulik), город, срочность и термин и отсортирует по доступности.

### Демо-данные

32 специалиста, 119 услуг, 147 отзывов, 24 бронирования, 12 заявок, 20 городов, 15 категорий.
Польские имена, реальные города województwa śląskiego. Фотографий реальных людей нет:
аватары — сгенерированные инициалы, портфолио — сгенерированная SVG-графика.
Данные детерминированы (seeded PRNG): одинаковые на сервере, клиенте и в `seed.sql`.

---

## Что является demo / mock

| Функция | Сейчас | Точка интеграции |
|---|---|---|
| Данные | `MockRepository` на `src/data/*` | `NEXT_PUBLIC_DATA_SOURCE=supabase` → `SupabaseRepository` |
| Новые брони и заявки | хранятся в памяти процесса до перезапуска | Supabase (`bookings`, `booking_items`, `requests`) |
| Авторизация | 3 демо-аккаунта, подписанная HMAC cookie | `AUTH_PROVIDER=supabase` → Supabase Auth (email/пароль, Google через `/auth/callback`) |
| Свободные слоты | детерминированная имитация занятости | запрос к `bookings` + `availability` (`src/features/booking/slots.ts`) |
| AI-разбор запроса | правила и ключевые слова (`MockAIService`) | `src/services/ai/ai-service.ts` — реализация на LLM с `AI_API_KEY` |
| Карта | SVG-схема по координатам городов | `src/services/maps` — Mapbox / Google Maps |
| Платежи и тарифы | только UI | `src/services/payments` — Stripe |
| Аналитика | `console.debug` в dev | `src/services/analytics` — PostHog |
| Rate limiting | in-memory (один процесс) | `src/services/rate-limit` — Upstash Redis / Postgres |
| Загрузка фото | превью в браузере | Supabase Storage (bucket'ы `avatars`, `request-photos`, приватный `verification`) |
| Кнопки в панелях (Potwierdź, Wyślij ofertę, Odpowiedz, Zatwierdź…) | меняют только локальное состояние UI | соответствующие route handlers / мутации Supabase |
| Zgłoszenia в админке, число пользователей | статичные примеры | таблицы `reports`, `profiles` |

Везде, где поведение имитируется, в интерфейсе есть пометка „Wersja demonstracyjna”.

---

## Подключение Supabase

1. Создайте проект в Supabase, заполните `.env` по образцу `.env.example`.
2. Примените миграции и seed:
   ```bash
   supabase link --project-ref <ref>
   supabase db push                 # supabase/migrations/*
   npm run db:seed:generate         # обновить supabase/seed.sql из src/data
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
3. `NEXT_PUBLIC_DATA_SOURCE=supabase`, при желании `AUTH_PROVIDER=supabase`.
4. Для Google: включите провайдер Google в Supabase Auth, redirect URL — `https://<домен>/auth/callback`.

Миграции и seed проверены на PostgreSQL 16 (с заглушкой схемы `auth`).
`SupabaseRepository` написан под эту схему, но против живого проекта Supabase ещё не запускался —
это первая задача в списке ниже.

### Схема БД (`supabase/migrations`)

`users` — это `auth.users` Supabase; данные приложения — в `profiles` (создаётся триггером при регистрации).

Таблицы: `profiles`, `categories`, `locations`, `providers`, `provider_categories`, `provider_locations`,
`services`, `service_options`, `portfolio_items`, `availability`, `bookings`, `booking_items`, `reviews`,
`requests`, `request_offers`, `favorites`, `messages`, `notifications`, `subscriptions`, `payments`,
`verification`, `reports`; view `provider_search`.

RLS включён на всех таблицах: каталог читается всеми; персональные данные — только владельцем;
отзыв может оставить только клиент завершённой брони; `verified`, `plan`, `featured` и агрегаты рейтинга
защищены триггером от изменения самим исполнителем; деньги и верификация пишутся только сервером (service role).

---

## Переменные окружения

См. `.env.example`. Ключевые:

| Переменная | Где используется |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, OpenGraph |
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` \| `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (публичные, с RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **только сервер**: гостевые брони/заявки, админ-статистика |
| `AUTH_PROVIDER` | `demo` \| `supabase` |
| `AUTH_COOKIE_SECRET` | подпись демо-сессии; в любом публичном деплое — длинная случайная строка |
| `NEXT_PUBLIC_MAPBOX_TOKEN`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `AI_API_KEY` | подготовленные интеграции |

Переменные валидируются через Zod в `src/lib/env.ts`.

---

## Структура проекта

```
src/
  app/
    (site)/              публичная часть (header, footer, mobile tab bar)
      page.tsx           главная
      uslugi/ specjalisci/ kategoria/[category]/ [city]/ [city]/[category]/
      specjalista/[slug]/ (+ rezerwacja/)
      zlecenie/ zaloz-profil/ cennik/ jak-to-dziala/ dla-wykonawcow/ logowanie/ konto/
    panel/               кабинет исполнителя (sidebar / bottom nav)
    admin/               админка
    api/                 bookings, requests, ai/interpret, auth/login, auth/logout
    auth/callback/       OAuth callback Supabase
    sitemap.ts robots.ts opengraph-image.tsx not-found.tsx error.tsx
  components/
    ui/                  примитивы в стиле shadcn/ui (Button, Input, Select, Badge, Sheet, Card)
    layout/ search/ providers/ seo/ shared/ dashboard/
  features/              бизнес-модули с состоянием: booking, request, onboarding, auth, dashboard, search
  services/
    data/                DataRepository (интерфейс) + Mock/Supabase реализации + общий search-engine
    ai/ maps/ payments/ analytics/ auth/ rate-limit/
  data/                  демо-датасет (города, категории, шаблоны, 32 профиля, генератор)
  lib/                   env, supabase-клиенты, seo, api-хелперы, cn()
  validation/            Zod-схемы (бронь, заявка, логин, onboarding)
  types/ utils/ config/
  proxy.ts               защита /panel и /admin (Next.js 16 proxy)
supabase/
  migrations/            схема + RLS
  seed.sql               сгенерированные демо-данные
scripts/generate-seed.ts
```

Принцип: страницы зависят только от `getRepository()` (интерфейс `DataRepository`),
поэтому переход с демо-данных на Supabase не трогает UI.

---

## Дизайн-система

- Один бренд-цвет — глубокий „petrol green” (`brand-700 #115545`) + холодная нейтральная палитра. Ощущение: доверие, локальность, спокойствие, без типичного маркетплейс-синего.
- Шрифты: **Bricolage Grotesque** (заголовки, характер) + **Onest** (текст; хорошая латиница с польскими знаками). Подключены из npm (`@fontsource-variable/*`) — без внешних запросов.
- Крупные скруглённые карточки (24 px), мягкие тени, много воздуха, чёткие CTA.
- Главный акцент — „стопка людей” в hero: карточки конкретных специалистов вместо абстрактной иллюстрации.
- Доступность: семантические заголовки и landmarks, видимый focus, `aria-*` у комбобокса города, шагов и статусов, `prefers-reduced-motion`, skip-link.
- Mobile-first: на телефоне — нижняя таб-навигация (сайт и кабинеты), липкая панель „Zarezerwuj” на профиле и в бронировании, фильтры в bottom sheet.

Токены — в `src/app/globals.css` (`@theme`).

---

## Безопасность

- Секреты только в env; service-role ключ используется исключительно на сервере.
- Все API-маршруты: проверка Origin, rate limiting, санитизация (`utils/sanitize.ts`) и Zod-валидация.
- Сессия демо-авторизации — HTTP-only cookie с HMAC-подписью и сроком жизни.
- Роли проверяются дважды: в `proxy.ts` и в server layout `/panel`, `/admin`.
- Security headers в `next.config.ts`; `/panel`, `/admin`, `/api`, бронирование закрыты в `robots.txt` и `noindex`.
- Supabase RLS-политики — см. выше.

---

## Проверено

- `npm run build`, `tsc --noEmit`, `eslint` — без ошибок.
- Все основные маршруты отвечают 200, несуществующие — 404; обход 700 внутренних ссылок — битых нет.
- E2E в Chrome: поиск с главной → бронирование до конца → заявка (валидация + автоподбор категории) → вход исполнителя и все разделы `/panel` → вход админа и все разделы `/admin` → onboarding из 10 шагов. Ошибок в консоли нет.
- Ширины 375 / 768 / 1024 / 1440: горизонтального переполнения нет.

---

## Следующие 10 задач до production

1. **Подключить живой Supabase**: прогнать `SupabaseRepository` на реальном проекте, интеграционные тесты для каждого метода репозитория.
2. **Реальная авторизация**: включить Supabase Auth (email + Google), регистрация клиента, восстановление пароля, привязка onboarding к `providers.user_id`.
3. **Сохранение действий из панелей**: route handlers для подтверждения брони, ответов на заявки (`request_offers`), ответов на отзывы, редактирования профиля и услуг.
4. **Календарь на реальных данных**: слоты из `availability` + `bookings`, исключения (отпуск), защита от двойного бронирования (exclusion constraint), синхронизация с Google Calendar.
5. **Уведомления**: e-mail (Resend) и SMS (SMSAPI.pl) о новой брони, подтверждении, напоминании за 24 ч, новых заявках в категории.
6. **Загрузка файлов**: Supabase Storage для аватаров, портфолио и фото заявок; ресайз, модерация, приватный bucket для документов верификации.
7. **Поиск в масштабе**: перенести фильтрацию в SQL (PostGIS для радиуса, `pg_trgm`/full-text для польского), кэширование и ISR для SEO-страниц (вынести проверку сессии из layout, чтобы публичные страницы стали статическими).
8. **Платежи и тарифы**: Stripe Checkout + webhooks для PRO/PRO+, featured-профилей и lead fees; Przelewy24/BLIK для Польши; счета-фактуры.
9. **Доверие и модерация**: процесс верификации (документы, телефон, NIP через API GUS/CEIDG), отзывы только после завершённой брони, жалобы, антиспам, RODO (согласия, экспорт/удаление данных, политика приватности и регламент).
10. **Качество и эксплуатация**: e2e-тесты Playwright в CI, Sentry, PostHog, распределённый rate limiting (Upstash), мониторинг Core Web Vitals, LLM-реализация `AIService`, после чего — расширение на другие województwa.
