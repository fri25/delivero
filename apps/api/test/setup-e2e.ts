// These suites check the full implementation (cash payments, livreur wallet,
// cash on delivery, Emplettes), which stays in the code: the V1 scope is a
// deployment setting, not a removal. They open what V1 closes.
// Runs before any import: ConfigModule.forRoot() reads and validates the
// environment as soon as AppModule is imported, so setting these in a
// beforeAll comes too late. dotenv does not override variables already set.
process.env.SERVICES_ACTIFS = 'repas,colis,courses_express,emplettes';
process.env.MODES_PAIEMENT_ACTIFS = 'mobile_money,especes';
process.env.CONTRE_REMBOURSEMENT_ACTIF = 'true';
