/**
 * Base Seeder class
 */
export abstract class Seeder {
  /**
   * Run the database seeds.
   */
  abstract run(): Promise<void>;

  /**
   * Call another seeder
   */
  async call(SeederClass: new () => Seeder): Promise<void> {
    const seeder = new SeederClass();
    await seeder.run();
  }
}
