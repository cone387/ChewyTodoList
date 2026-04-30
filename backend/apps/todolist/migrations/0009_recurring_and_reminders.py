# Generated for M1 (recurring tasks + reminders), 2026-04-30
# Spec: docs/spec-2026-Q2-recurring-and-reminders.md

import apps.todolist.models
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('todolist', '0008_add_card_config_and_update_views'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # === Task: 重复任务相关字段 ===
        migrations.AddField(
            model_name='task',
            name='recurrence_rule',
            field=models.CharField(
                blank=True, null=True, max_length=255,
                help_text="iCalendar RRULE 字符串，如 'FREQ=WEEKLY;BYDAY=MO,WE,FR'",
                verbose_name='重复规则',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_parent',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='recurrence_children',
                to='todolist.task', to_field='uid',
                help_text='指向系列模板任务；模板任务本身此字段为 null',
                verbose_name='重复系列源',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_dtstart',
            field=models.DateTimeField(
                blank=True, null=True,
                help_text='RRULE 的 DTSTART；通常等于 start_date 或 due_date',
                verbose_name='重复起始时间',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_exdates',
            field=models.JSONField(
                blank=True, default=list,
                help_text='被跳过的实例日期 ISO 列表',
                verbose_name='排除日期',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='is_recurrence_template',
            field=models.BooleanField(
                db_index=True, default=False,
                help_text='True=模板（不出现在普通列表），False=具体实例',
                verbose_name='是否重复系列模板',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['user', 'recurrence_parent'],
                name='task_user_recur_parent_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['user', 'is_recurrence_template'],
                name='task_user_recur_tpl_idx',
            ),
        ),

        # === Reminder: 新模型 ===
        migrations.CreateModel(
            name='Reminder',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(
                    db_index=True, default=django.utils.timezone.now, verbose_name='创建时间',
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True, db_index=True, verbose_name='更新时间',
                )),
                ('uid', models.CharField(
                    default=apps.todolist.models.generate_uid,
                    editable=False, max_length=22, unique=True, verbose_name='UID',
                )),
                ('type', models.CharField(
                    choices=[('absolute', '绝对时间'), ('relative', '相对截止时间')],
                    default='relative', max_length=16, verbose_name='提醒类型',
                )),
                ('trigger_at', models.DateTimeField(
                    blank=True, db_index=True, null=True, verbose_name='触发时间（绝对）',
                )),
                ('offset_minutes', models.IntegerField(
                    blank=True, null=True,
                    help_text='正数=提前 N 分钟，0=到时，负数=延后',
                    verbose_name='偏移分钟',
                )),
                ('relative_to', models.CharField(
                    choices=[('due_date', '截止时间'), ('start_date', '开始时间')],
                    default='due_date', max_length=16, verbose_name='相对基准字段',
                )),
                ('status', models.CharField(
                    choices=[
                        ('pending', '待触发'), ('triggered', '已触发'),
                        ('dismissed', '已忽略'), ('cancelled', '已取消'),
                    ],
                    db_index=True, default='pending', max_length=16, verbose_name='状态',
                )),
                ('triggered_at', models.DateTimeField(blank=True, null=True, verbose_name='实际触发时间')),
                ('client_notification_id', models.CharField(
                    blank=True, default='', max_length=128, verbose_name='客户端通知 ID',
                )),
                ('task', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reminders', to='todolist.task', to_field='uid',
                    verbose_name='任务',
                )),
                ('user', models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL, verbose_name='用户',
                )),
            ],
            options={
                'db_table': 'ct_reminders',
                'ordering': ['trigger_at', '-created_at'],
                'verbose_name': '任务提醒',
                'verbose_name_plural': '任务提醒',
                'indexes': [
                    models.Index(fields=['user', 'status', 'trigger_at'], name='reminder_user_status_at_idx'),
                    models.Index(fields=['task', 'status'], name='reminder_task_status_idx'),
                ],
            },
        ),
    ]
