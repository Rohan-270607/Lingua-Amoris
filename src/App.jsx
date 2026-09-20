import { Route, Routes } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout'
import Cover from './pages/Cover'
import Archive from './pages/Archive'
import Add from './pages/Add'
import NotFound from './pages/NotFound'

/**
 * The cover at "/" stands outside the layout — it is just the name, with
 * none of the register or colophon chrome. Everything else hangs off the
 * one layout route, so the background, nav and footer persist while only
 * the page itself transitions. New pages go here and in src/lib/nav.js.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Cover />} />

      <Route element={<RootLayout />}>
        <Route path="archive" element={<Archive />} />
        <Route path="add" element={<Add />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
