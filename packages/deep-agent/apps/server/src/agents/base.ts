import {
  AbstractAgent,
  type RunAgentInput,
  type BaseEvent,
} from "@ag-ui/client";
import type { Observable } from "rxjs";

/**
 * Base agent class that all agents in the system extend.
 * 
 * Subclasses must implement the `run` method which returns
 * an Observable of AG-UI BaseEvent.
 * 
 * Tools and skills are accessed via direct imports from their registries.
 */
export abstract class BaseAgent extends AbstractAgent {
  abstract run(input: RunAgentInput): Observable<BaseEvent>;
}
