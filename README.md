# MovieBrowserMM

Застосунок для пошуку фільмів через [OMDb API](https://www.omdbapi.com/), побудований на Expo + React Native + TypeScript з навігацією на [React Navigation](https://reactnavigation.org/) (native stack).

## Можливості

- Пошук фільмів за назвою з пагінацією (довантаження сторінок при скролі)
- Список результатів за замовчуванням, поки нічого не шукали
- Детальна картка фільму: постер, рейтинг IMDb, сюжет, режисер, актори, нагороди тощо

## Структура проєкту

```
App.tsx                  — кореневий компонент, NavigationContainer + стек-навігатор
index.ts                 — точка входу (registerRootComponent)
src/
  lib/omdb.ts             — клієнт OMDb API
  screens/
    SearchScreen.tsx      — екран пошуку і списку результатів
    MovieDetailsScreen.tsx — екран деталей фільму
```

## Запуск

1. Встановити залежності:

   ```bash
   npm install
   ```

2. Створити файл `.env` у корені проєкту (за зразком `.env.example`) і додати свій ключ OMDb API:

   ```
   EXPO_PUBLIC_OMDB_API_KEY=your_omdb_api_key_here
   ```

   Безкоштовний ключ можна отримати на [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx).

3. Запустити дев-сервер:

   ```bash
   npx expo start
   ```

   Далі відкрити застосунок в [Expo Go](https://expo.dev/go) (QR-код), Android-емуляторі, iOS-симуляторі або у вебі (`npx expo start --web`).

## Лінт і перевірка типів

```bash
npx expo lint
npx tsc --noEmit
```
