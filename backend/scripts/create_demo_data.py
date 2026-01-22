#!/usr/bin/env python
"""
创建演示数据脚本
用于展示视图模板功能
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.todolist.models import Group, Project, Tag, Task

User = get_user_model()

def create_demo_data():
    """创建演示数据"""
    
    # 获取测试用户（user_id=2）
    try:
        user = User.objects.get(id=2)
        print(f"找到用户: {user.username}")
    except User.DoesNotExist:
        print("错误: 找不到 user_id=2 的用户")
        return
    
    # 清理现有数据
    print("\n清理现有数据...")
    Task.objects.filter(user=user).delete()
    Tag.objects.filter(user=user).delete()
    Project.objects.filter(user=user).delete()
    Group.objects.filter(user=user).delete()
    
    # 创建分组
    print("\n创建分组...")
    group_work = Group.objects.create(
        user=user,
        name="工作",
        desc="工作相关项目",
        sort_order=1
    )
    group_personal = Group.objects.create(
        user=user,
        name="个人",
        desc="个人生活项目",
        sort_order=2
    )
    print(f"✓ 创建了 {Group.objects.filter(user=user).count()} 个分组")
    
    # 创建项目
    print("\n创建项目...")
    projects = {
        'product': Project.objects.create(
            user=user,
            group=group_work,
            name="产品开发",
            desc="产品功能开发和优化",
            view_type='list',
            sort_order=1
        ),
        'marketing': Project.objects.create(
            user=user,
            group=group_work,
            name="市场营销",
            desc="市场推广和品牌建设",
            view_type='list',
            sort_order=2
        ),
        'design': Project.objects.create(
            user=user,
            group=group_work,
            name="设计工作",
            desc="UI/UX设计相关",
            view_type='card',
            sort_order=3
        ),
        'personal': Project.objects.create(
            user=user,
            group=group_personal,
            name="个人成长",
            desc="学习和自我提升",
            view_type='list',
            sort_order=4
        ),
        'life': Project.objects.create(
            user=user,
            group=group_personal,
            name="生活事务",
            desc="日常生活安排",
            view_type='list',
            sort_order=5
        ),
    }
    print(f"✓ 创建了 {len(projects)} 个项目")
    
    # 创建标签
    print("\n创建标签...")
    tags = {
        'urgent': Tag.objects.create(user=user, name="紧急", color="#ef4444", sort_order=1),
        'important': Tag.objects.create(user=user, name="重要", color="#f59e0b", sort_order=2),
        'design': Tag.objects.create(user=user, name="设计", color="#8b5cf6", sort_order=3),
        'dev': Tag.objects.create(user=user, name="开发", color="#3b82f6", sort_order=4),
        'meeting': Tag.objects.create(user=user, name="会议", color="#10b981", sort_order=5),
        'doc': Tag.objects.create(user=user, name="文档", color="#6366f1", sort_order=6),
        'review': Tag.objects.create(user=user, name="评审", color="#ec4899", sort_order=7),
        'test': Tag.objects.create(user=user, name="测试", color="#14b8a6", sort_order=8),
        'bug': Tag.objects.create(user=user, name="Bug修复", color="#dc2626", sort_order=9),
        'feature': Tag.objects.create(user=user, name="新功能", color="#059669", sort_order=10),
        'habit': Tag.objects.create(user=user, name="习惯", color="#7c3aed", sort_order=11),
        'milestone': Tag.objects.create(user=user, name="里程碑", color="#ea580c", sort_order=12),
    }
    print(f"✓ 创建了 {len(tags)} 个标签")
    
    # 获取当前时间
    now = timezone.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 创建任务数据
    print("\n创建任务...")
    tasks_data = [
        # 今日任务（用于"今日专注"模板）
        {
            'title': '完成产品需求文档',
            'content': '整理用户反馈，更新PRD文档，准备下周评审',
            'project': projects['product'],
            'status': 1,  # TODO
            'priority': 3,  # URGENT
            'due_date': today,
            'tags': [tags['urgent'], tags['important'], tags['doc']],
        },
        {
            'title': '修复登录页面Bug',
            'content': '用户反馈登录时偶尔出现超时，需要排查原因',
            'project': projects['product'],
            'status': 1,
            'priority': 3,
            'due_date': today,
            'tags': [tags['urgent'], tags['bug'], tags['dev']],
        },
        {
            'title': '设计新功能界面',
            'content': '根据产品需求设计用户中心页面的UI',
            'project': projects['design'],
            'status': 1,
            'priority': 2,
            'due_date': today,
            'tags': [tags['design'], tags['important']],
        },
        
        # 逾期任务（用于"逾期任务"模板）
        {
            'title': '优化数据库查询性能',
            'content': '分析慢查询日志，优化索引配置',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today - timedelta(days=2),
            'tags': [tags['dev'], tags['important']],
        },
        {
            'title': '准备周会演示材料',
            'content': '整理本周工作进展，准备PPT',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today - timedelta(days=1),
            'tags': [tags['meeting'], tags['doc']],
        },
        {
            'title': '更新项目文档',
            'content': '补充API文档和使用说明',
            'project': projects['product'],
            'status': 1,
            'priority': 1,
            'due_date': today - timedelta(days=3),
            'tags': [tags['doc']],
        },
        
        # 高优先级任务（用于"高优先级任务"模板）
        {
            'title': '系统安全漏洞修复',
            'content': '修复安全扫描发现的高危漏洞',
            'project': projects['product'],
            'status': 1,
            'priority': 3,
            'due_date': today + timedelta(days=1),
            'tags': [tags['urgent'], tags['bug'], tags['dev']],
        },
        {
            'title': '客户需求紧急沟通',
            'content': '大客户提出新需求，需要尽快评估',
            'project': projects['marketing'],
            'status': 1,
            'priority': 3,
            'due_date': today + timedelta(days=1),
            'tags': [tags['urgent'], tags['meeting']],
        },
        {
            'title': '产品发布前测试',
            'content': '完成所有功能的回归测试',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=2),
            'tags': [tags['important'], tags['test']],
        },
        
        # 本周任务（用于"本周任务"模板）
        {
            'title': '编写API文档',
            'content': '使用Swagger生成API文档',
            'project': projects['product'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=3),
            'tags': [tags['doc'], tags['dev']],
        },
        {
            'title': '用户访谈和调研',
            'content': '收集用户反馈，改进产品体验',
            'project': projects['marketing'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=4),
            'tags': [tags['meeting']],
        },
        {
            'title': '代码审查和重构',
            'content': '重构支付模块代码，提高可维护性',
            'project': projects['product'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=5),
            'tags': [tags['dev'], tags['review']],
        },
        {
            'title': 'UI/UX设计评审',
            'content': '评审新版本的设计稿',
            'project': projects['design'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=6),
            'tags': [tags['design'], tags['review']],
        },
        
        # 已完成任务（用于"已完成任务"模板）
        {
            'title': '完成用户注册功能',
            'content': '实现邮箱验证和手机验证',
            'project': projects['product'],
            'status': 2,  # COMPLETED
            'priority': 2,
            'due_date': today - timedelta(days=5),
            'completed_time': now - timedelta(days=2),
            'tags': [tags['dev'], tags['feature']],
        },
        {
            'title': '设计系统图标库',
            'content': '整理常用图标，建立设计规范',
            'project': projects['design'],
            'status': 2,
            'priority': 1,
            'due_date': today - timedelta(days=7),
            'completed_time': now - timedelta(days=3),
            'tags': [tags['design']],
        },
        {
            'title': '数据备份测试',
            'content': '测试数据库备份和恢复流程',
            'project': projects['product'],
            'status': 2,
            'priority': 1,
            'due_date': today - timedelta(days=10),
            'completed_time': now - timedelta(days=5),
            'tags': [tags['test']],
        },
        {
            'title': '竞品分析报告',
            'content': '分析主要竞争对手的产品特性',
            'project': projects['marketing'],
            'status': 2,
            'priority': 1,
            'due_date': today - timedelta(days=8),
            'completed_time': now - timedelta(days=4),
            'tags': [tags['doc']],
        },
        
        # 看板视图任务（不同状态）
        {
            'title': '实现支付功能',
            'content': '集成第三方支付接口',
            'project': projects['product'],
            'status': 0,  # UNASSIGNED
            'priority': 2,
            'due_date': today + timedelta(days=10),
            'tags': [tags['dev'], tags['feature']],
        },
        {
            'title': '性能优化方案',
            'content': '制定系统性能优化计划',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=8),
            'tags': [tags['dev'], tags['doc']],
        },
        {
            'title': '移动端适配',
            'content': '优化移动端用户体验',
            'project': projects['design'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=12),
            'tags': [tags['design']],
        },
        
        # 个人成长任务（用于习惯追踪）
        {
            'title': '学习React 19新特性',
            'content': '阅读官方文档，实践新API',
            'project': projects['personal'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=7),
            'tags': [tags['habit']],
        },
        {
            'title': '每日阅读30分钟',
            'content': '阅读技术书籍或文章',
            'project': projects['personal'],
            'status': 2,
            'priority': 0,
            'due_date': today,
            'completed_time': now,
            'tags': [tags['habit']],
        },
        {
            'title': '整理技术笔记',
            'content': '整理本周学习的知识点',
            'project': projects['personal'],
            'status': 1,
            'priority': 0,
            'due_date': today + timedelta(days=2),
            'tags': [tags['habit'], tags['doc']],
        },
        
        # 里程碑任务（用于里程碑追踪）
        {
            'title': 'V2.0版本发布',
            'content': '完成所有功能开发和测试，准备上线',
            'project': projects['product'],
            'status': 1,
            'priority': 3,
            'due_date': today + timedelta(days=30),
            'tags': [tags['milestone'], tags['important']],
        },
        {
            'title': '用户量突破10万',
            'content': '制定增长策略，达成用户目标',
            'project': projects['marketing'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=60),
            'tags': [tags['milestone']],
        },
        {
            'title': '设计系统1.0发布',
            'content': '完成设计规范和组件库',
            'project': projects['design'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=45),
            'tags': [tags['milestone'], tags['design']],
        },
        
        # 生活事务任务
        {
            'title': '健身计划',
            'content': '每周健身3次',
            'project': projects['life'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=7),
            'tags': [tags['habit']],
        },
        {
            'title': '家庭聚餐',
            'content': '周末和家人聚餐',
            'project': projects['life'],
            'status': 1,
            'priority': 1,
            'due_date': today + timedelta(days=5),
            'tags': [],
        },
        
        # 更多任务以展示不同场景
        {
            'title': '制定下季度OKR',
            'content': '与团队讨论目标和关键结果',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=14),
            'tags': [tags['important'], tags['meeting']],
        },
        {
            'title': '团队建设活动策划',
            'content': '组织团队团建活动',
            'project': projects['marketing'],
            'status': 1,
            'priority': 0,
            'due_date': today + timedelta(days=20),
            'tags': [tags['meeting']],
        },
        {
            'title': '部署生产环境',
            'content': '配置CI/CD流程，部署到生产',
            'project': projects['product'],
            'status': 1,
            'priority': 2,
            'due_date': today + timedelta(days=15),
            'tags': [tags['dev'], tags['important']],
        },
    ]
    
    # 创建任务
    created_count = 0
    for task_data in tasks_data:
        tags_list = task_data.pop('tags', [])
        task = Task.objects.create(
            user=user,
            **task_data
        )
        if tags_list:
            task.tags.set(tags_list)
        created_count += 1
    
    print(f"✓ 创建了 {created_count} 个任务")
    
    # 统计信息
    print("\n" + "="*50)
    print("数据创建完成！统计信息：")
    print("="*50)
    print(f"分组数量: {Group.objects.filter(user=user).count()}")
    print(f"项目数量: {Project.objects.filter(user=user).count()}")
    print(f"标签数量: {Tag.objects.filter(user=user).count()}")
    print(f"任务总数: {Task.objects.filter(user=user).count()}")
    print(f"  - 未分配: {Task.objects.filter(user=user, status=0).count()}")
    print(f"  - 待办: {Task.objects.filter(user=user, status=1).count()}")
    print(f"  - 已完成: {Task.objects.filter(user=user, status=2).count()}")
    print(f"  - 今日任务: {Task.objects.filter(user=user, due_date__date=today.date()).count()}")
    print(f"  - 逾期任务: {Task.objects.filter(user=user, due_date__lt=now, status__in=[0,1]).count()}")
    print(f"  - 高优先级: {Task.objects.filter(user=user, priority__gte=2).count()}")
    print("="*50)

if __name__ == '__main__':
    print("开始创建演示数据...")
    print("="*50)
    create_demo_data()
    print("\n✅ 演示数据创建成功！")
    print("\n现在可以登录测试账户查看各个模板的效果了。")
