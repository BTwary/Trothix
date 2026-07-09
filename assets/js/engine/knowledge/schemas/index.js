/**
 * @fileoverview schemas/index.js
 *
 * Explicit static registration of every schema module. This is the single
 * place that lists all known schemas — no filesystem scanning, no dynamic
 * `import()`, no reflection. Importing this module registers all schemas
 * into the shared SchemaRegistry singleton as a side effect; callers
 * (KnowledgeLinter) import this once at startup.
 */

import { schemaRegistry } from './SchemaRegistry.js';

import ConceptSchema from './ConceptSchema.js';
import RulesSchema from './RulesSchema.js';
import RelationsSchema from './RelationsSchema.js';
import KnowledgeSchema from './KnowledgeSchema.js';
import MetadataSchema from './MetadataSchema.js';
import CoverageSchema from './CoverageSchema.js';
import ActionsSchema from './ActionsSchema.js';
import EntitiesSchema from './EntitiesSchema.js';
import PhrasesSchema from './PhrasesSchema.js';
import ActorsSchema from './ActorsSchema.js';
import ObjectsSchema from './ObjectsSchema.js';
import TemplatesSchema from './TemplatesSchema.js';
import DecisionTablesSchema from './DecisionTablesSchema.js';
import EnumsSchema from './EnumsSchema.js';
import StatesSchema from './StatesSchema.js';
import ExceptionsSchema from './ExceptionsSchema.js';
import IntentsSchema from './IntentsSchema.js';
import ModalsSchema from './ModalsSchema.js';
import NegationsSchema from './NegationsSchema.js';
import ConditionsSchema from './ConditionsSchema.js';
import ConstraintsSchema from './ConstraintsSchema.js';
import EventsSchema from './EventsSchema.js';
import ModifiersSchema from './ModifiersSchema.js';

schemaRegistry.registerAll([
  ConceptSchema,
  RulesSchema,
  RelationsSchema,
  KnowledgeSchema,
  MetadataSchema,
  CoverageSchema,
  ActionsSchema,
  EntitiesSchema,
  PhrasesSchema,
  ActorsSchema,
  ObjectsSchema,
  TemplatesSchema,
  DecisionTablesSchema,
  EnumsSchema,
  StatesSchema,
  ExceptionsSchema,
  IntentsSchema,
  ModalsSchema,
  NegationsSchema,
  ConditionsSchema,
  ConstraintsSchema,
  EventsSchema,
  ModifiersSchema
]);

export { schemaRegistry };
