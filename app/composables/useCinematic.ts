export function useCinematic() {
  let cleanup: (() => void) | undefined
  let disposed = false
  onMounted(async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    if (disposed) return
    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true },
        })
      })
    })
    cleanup = () => context.revert()
  })
  onBeforeUnmount(() => {
    disposed = true
    cleanup?.()
  })
}
