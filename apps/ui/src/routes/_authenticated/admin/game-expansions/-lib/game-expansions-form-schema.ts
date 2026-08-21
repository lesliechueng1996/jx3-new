import { z } from 'zod';

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const expansionFormSchema = z
  .object({
    name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
    level: z
      .string()
      .trim()
      .min(1, '请输入等级')
      .refine((value) => /^\d+$/.test(value), '等级须为整数')
      .refine((value) => {
        const parsed = Number(value);
        return parsed >= 1 && parsed <= 200;
      }, '等级须为 1-200'),
    description: z.string().max(2000, '描述最多 2000 个字符'),
    startDate: z.string().regex(dateOnlyPattern, '请选择起始日期'),
    endDate: z
      .string()
      .refine(
        (value) => value === '' || dateOnlyPattern.test(value),
        '终止日期格式不正确',
      ),
  })
  .superRefine((values, ctx) => {
    if (values.endDate.length > 0 && values.startDate > values.endDate) {
      ctx.addIssue({
        code: 'custom',
        message: '起始日期不能晚于终止日期',
        path: ['endDate'],
      });
    }
  });

export type ExpansionFormValues = z.infer<typeof expansionFormSchema>;
