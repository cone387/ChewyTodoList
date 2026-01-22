# Generated migration for adding is_visible_in_nav field to TaskView

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('todolist', '0002_taskview'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskview',
            name='is_visible_in_nav',
            field=models.BooleanField(default=True, verbose_name='是否在导航栏显示'),
        ),
    ]