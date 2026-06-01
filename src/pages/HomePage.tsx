import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { CityGrid } from '../components/CityGrid'
import { StatsSection } from '../components/StatsSection'
import { ProductCards } from '../components/ProductCards'
import { HowItWorks } from '../components/HowItWorks'
import { Testimonial } from '../components/Testimonial'
import { Footer } from '../components/Footer'

export function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-brand-black">
      <Header />
      <main className="flex-1">
        <Hero />
        <CityGrid />
        <StatsSection />
        <ProductCards />
        <HowItWorks />
        <Testimonial />
      </main>
      <Footer />
    </div>
  )
}
