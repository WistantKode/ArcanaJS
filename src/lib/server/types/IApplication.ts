import { Express } from "express";
import { Container } from "../../di/Container";

/**
 * Interface representing the minimal application structure
 * needed by service providers
 */
export interface IApplication {
  app: Express;
  container: Container;
}
