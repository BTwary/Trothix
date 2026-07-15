/**
 * @fileoverview ConfidenceProfile.js
 * Abstraction for loading and managing confidence weights configuration.
 */

import fs from 'fs';
import path from 'path';

export class ConfidenceProfile {
  /**
   * Returns the unique identifier for this profile.
   * @returns {string}
   */
  get id() {
    throw new Error("id getter must be implemented by ConfidenceProfile subclasses.");
  }

  /**
   * Returns the version of this profile.
   * @returns {string}
   */
  get version() {
    throw new Error("version getter must be implemented by ConfidenceProfile subclasses.");
  }

  /**
   * Returns the weights mapping.
   * @returns {Object} Key-value pair of signal to weight
   */
  getWeights() {
    throw new Error("getWeights() must be implemented by ConfidenceProfile subclasses.");
  }
}

export class DefaultConfidenceProfile extends ConfidenceProfile {
  /**
   * @param {string} weightsPath - Directory where weights config is located
   */
  constructor(weightsPath) {
    super();
    this.weightsPath = weightsPath;
    this._weights = {
      extraction: 0.3,
      evidence: 0.2,
      coverage: 0.2,
      contradiction: 0.3
    };
    this._version = "1.0.0";
    
    if (weightsPath) {
      try {
        const filePath = path.join(weightsPath, 'confidence-weights.json');
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);
          if (data.weights) this._weights = data.weights;
          if (data.version) this._version = data.version;
        }
      } catch (e) {
        console.warn("[DefaultConfidenceProfile] Failed to load confidence-weights.json. Using fallback weights.", e.message);
      }
    }
  }

  get id() {
    return "default-json-profile";
  }

  get version() {
    return this._version;
  }

  getWeights() {
    return { ...this._weights };
  }
}
