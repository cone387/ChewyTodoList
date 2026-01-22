from django.core.management.base import BaseCommand
from apps.todolist.models import TaskView


class Command(BaseCommand):
    help = '修复视图筛选器中的日期操作符值'

    def handle(self, *args, **options):
        # 不需要值的操作符列表
        no_value_operators = [
            'is_empty', 'is_not_empty', 'is_today', 'is_yesterday', 'is_tomorrow',
            'is_this_week', 'is_last_week', 'is_next_week', 'is_this_month',
            'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date',
            'is_true', 'is_false'
        ]
        
        fixed_count = 0
        total_filters_fixed = 0
        
        self.stdout.write('开始检查视图筛选器...')
        
        for view in TaskView.objects.all():
            if not view.filters:
                continue
            
            modified = False
            for filter_rule in view.filters:
                operator = filter_rule.get('operator')
                if operator in no_value_operators:
                    if filter_rule.get('value') is not None:
                        old_value = filter_rule.get('value')
                        filter_rule['value'] = None
                        # 同时移除 value2
                        if 'value2' in filter_rule:
                            filter_rule.pop('value2')
                        modified = True
                        total_filters_fixed += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"  修复视图 '{view.name}' (UID: {view.uid})\n"
                                f"    操作符: {operator}\n"
                                f"    旧值: {old_value} -> 新值: null"
                            )
                        )
            
            if modified:
                view.save(update_fields=['filters'])
                fixed_count += 1
        
        if fixed_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ 成功修复 {fixed_count} 个视图的 {total_filters_fixed} 个筛选器'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n✓ 所有视图的筛选器都是正确的，无需修复')
            )
