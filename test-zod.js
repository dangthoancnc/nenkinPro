const { z } = require('zod');
const generateDocSchema = z.object({
  applicationId: z.string().uuid(),
  templateName: z.enum([
    'LAN1_DATTAI',
    'LAN2_UININJOU',
  ]).optional(),
  templateType: z.enum(['LAN1_DATTAI', 'LAN2_UININJOU']).optional()
}).strict();

const body = { applicationId: "12345678-1234-1234-1234-123456789012", templateName: ["LAN1_DATTAI"] };
const result = generateDocSchema.safeParse(body);
console.log(result.success);
