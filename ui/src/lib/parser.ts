
import { z, ZodSchema, ZodObject, ZodString, ZodTypeAny } from "zod";

export type JsonSchemaProperty = {
    type: string;
    description?: string;
    default?: string;
    pattern?: string;
    format?: string;
    minLength?: number;  // For strings
    minItems?: number;   // For arrays
}

export type JsonSchema = {
    $schema?: string;
    title?: string;
    type: string;
    properties: {
        [key: string]: JsonSchemaProperty;
    };
    required?: string[];
}
 

function convertType(property?: JsonSchemaProperty): ZodTypeAny {
    switch (property?.type) {
        case "string":
            return z.string();
        case "number":
            return z.number();
        case "boolean":
            return z.boolean();
        case "array": {
            let zodArray = z.array(z.any());
            if (property?.minItems !== undefined) {
                zodArray = zodArray.min(property.minItems, {
                    message: `Minimum number of items is ${property.minItems}`,
                });
            }
            return zodArray;
        }
        case "object":
            return z.object({});
        default:
            throw new Error(`Unsupported type: ${property?.type}`);
    }
}

export default function generateZodSchema(jsonSchema: JsonSchema): ZodObject<any> {
    if (!jsonSchema) {
        throw new Error("jsonSchema is undefined or null.");
    }

    if (typeof jsonSchema !== 'object') {
        throw new Error(`Expected jsonSchema to be an object, but got ${typeof jsonSchema}.`);
    }

    if (!jsonSchema.properties) {
        throw new Error("jsonSchema.properties is undefined or null.");
    }

    if (typeof jsonSchema.properties !== 'object') {
        throw new Error(`Expected jsonSchema.properties to be an object, but got ${typeof jsonSchema.properties}.`);
    }

    const zodProperties: { [key: string]: ZodTypeAny } = {};

    for (const key in jsonSchema.properties) {
        const property = jsonSchema.properties[key];
        let zodType = convertType(property);


        if (property.format) {
            switch (property.format) {
                case "uri":
                    zodType = (zodType as ZodString).url({
                        message: `${key} must be a valid URL`,
                    });
                    break;
                default:
                    break;
            }
        }

        // if (property.default !== undefined) {
        //     zodType = zodType.default(property.default);
        // }

        zodProperties[key] = zodType;
    }

    const zodSchema = z.object(zodProperties);

    if (jsonSchema.required) {
        return zodSchema.pick(jsonSchema.required.reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, true>));
    }

    return zodSchema;
}