// "Agora" da aplicação. DEMO_TODAY=YYYY-MM-DD no .env fixa o dia (útil para apresentar num fim de semana,
// já que a ofensiva e o destaque da grade dependem das aulas do dia).
export function now(): Date {
  const demo = process.env.DEMO_TODAY;
  const real = new Date();
  if (!demo || !/^\d{4}-\d{2}-\d{2}$/.test(demo)) return real;
  const [y, m, d] = demo.split("-").map(Number);
  return new Date(y, m - 1, d, real.getHours(), real.getMinutes());
}
