# StaffHub UNS Pro - Performance Benchmark Report

**Generated:** 2025-12-28
**Project:** StaffHub UNS Pro v1.0.0
**Build Tool:** Vite 6.4.1

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Build Time | 25.54s | ⚠️ Moderate |
| Total JS Bundle | 1.61 MB | ✅ Good |
| Gzipped Size | ~520 KB | ✅ Excellent |
| Test Suite | 46 tests passing | ✅ Passing |
| Test Duration | 6.92s | ✅ Fast |
| Lines of Code | 6,296 | - |

---

## 1. Build Performance

### Vite Production Build

```
Build Time: 25.54 seconds
Modules Transformed: 2,925
```

**Analysis:**
- Build time is moderate for a React SPA of this size
- 2,925 modules include all dependencies (React, Dexie, Recharts, Radix UI, etc.)

**Warnings Detected:**
- ⚠️ Circular dependency warning in Recharts (Dashboard.tsx, StatsDashboard.tsx)
- These can cause execution order issues in chunked builds

---

## 2. Bundle Size Analysis

### Total Output

| Category | Size |
|----------|------|
| JS Bundles | 1.61 MB (uncompressed) |
| Static Assets | 1.7 MB |
| Employee Photos | 704 MB |
| **Total dist/** | 718 MB |

> Note: 704 MB is employee photos in public/photos/ - not part of JS bundle

### Top 10 Largest Chunks

| Chunk | Size | Gzipped |
|-------|------|---------|
| index-Dd5Hbft7.js | 447.69 KB | 129.79 KB |
| AreaChart-BbmUgGD7.js | 361.23 KB | 108.11 KB |
| DatabaseManager-uHJZjuyD.js | 346.82 KB | 118.34 KB |
| StaffTable-DIPULdNE.js | 176.10 KB | 50.30 KB |
| animations-CgdJ9_Y0.js | 113.97 KB | 37.57 KB |
| validation-BGdCB66h.js | 66.45 KB | 18.16 KB |
| confirm-dialog-y43z-9BE.js | 41.42 KB | 13.69 KB |
| RirekishoForm-DqlTzX5z.js | 27.60 KB | 6.96 KB |
| StatsDashboard-BxTPcsKr.js | 26.50 KB | 8.49 KB |
| cn-BLcp5ZSu.js | 20.74 KB | 7.05 KB |

### Bundle Breakdown

```
┌────────────────────────────────────────────────────────┐
│ index.js (main entry)                     448 KB  27% │
│ AreaChart (Recharts)                      361 KB  22% │
│ DatabaseManager (sql.js)                  347 KB  21% │
│ StaffTable                                176 KB  11% │
│ animations (framer-motion)                114 KB   7% │
│ Other chunks                              206 KB  12% │
└────────────────────────────────────────────────────────┘
                                     Total: 1.61 MB
```

---

## 3. Test Performance

### Test Suite Execution

```
Test Runner: Vitest 4.0.16
Test Files: 3 passed
Tests: 46 passed
Duration: 6.92s total
```

| Test File | Tests | Duration |
|-----------|-------|----------|
| sqliteService.test.ts | 7 | 18ms |
| validation.test.ts | 11 | 39ms |
| EmployeeCard.test.tsx | 28 | 771ms |

**Breakdown:**
- Transform: 929ms
- Setup: 2.19s
- Import: 1.75s
- Tests: 828ms
- Environment: 11.12s

---

## 4. Code Metrics

```
Total Lines of Code: 6,296
Major Components:
- RirekishoForm.tsx: ~1,200 lines (largest)
- StaffTable.tsx: ~600 lines
- App.tsx: ~500 lines
```

---

## 5. Dependency Analysis

| Category | Count |
|----------|-------|
| Direct Dependencies | 35 |
| Total (with nested) | 286 |

### Heavy Dependencies

| Package | Impact |
|---------|--------|
| sql.js | ~350 KB (SQLite in WASM) |
| recharts | ~360 KB (Chart library) |
| framer-motion | ~114 KB (Animations) |
| dexie | ~80 KB (IndexedDB wrapper) |

---

## 6. Recommendations

### High Priority

1. **Lazy Load Charts**
   ```tsx
   const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
   ```
   Potential saving: 360 KB deferred

2. **Lazy Load SQLite Export**
   ```tsx
   const DatabaseManager = lazy(() => import('./components/DatabaseManager'));
   ```
   Potential saving: 350 KB deferred

3. **Fix Recharts Circular Dependency**
   Import specific components instead of barrel exports:
   ```tsx
   // Instead of: import { Bar, AreaChart } from 'recharts'
   import { Bar } from 'recharts/es6/cartesian/Bar'
   import { AreaChart } from 'recharts/es6/chart/AreaChart'
   ```

### Medium Priority

4. **Optimize Employee Photos**
   - Current: 704 MB in dist/photos
   - Recommendation: Move to CDN or Supabase Storage
   - Compress images (target: 100KB per photo)

5. **Tree-shake Animations**
   - Only import needed animation utilities from framer-motion

### Low Priority

6. **Enable Brotli Compression**
   - Could reduce gzipped size by additional 15-20%

---

## 7. Performance Scores

### Overall Rating: B+

| Category | Score | Notes |
|----------|-------|-------|
| Build Speed | B | 25s is acceptable, room for improvement |
| Bundle Size | A- | 1.6MB JS is good for feature-rich SPA |
| Code Splitting | A | Good use of dynamic imports |
| Gzip Ratio | A | ~68% compression ratio |
| Test Coverage | B+ | 46 tests, good coverage of EmployeeCard |

---

## 8. Comparison Benchmarks

| Metric | This Project | Industry Avg | Target |
|--------|--------------|--------------|--------|
| Initial JS | 448 KB | 300-500 KB | ✅ |
| Total JS | 1.61 MB | 1-2 MB | ✅ |
| Build Time | 25s | 20-40s | ✅ |
| Test Time | 7s | 5-15s | ✅ |
| LCP (estimated) | ~2s | <2.5s | ✅ |

---

*Report generated by `/benchmark` command*
