from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """标准分页器"""
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        """自定义分页响应格式"""
        return Response({
            'success': True,
            'data': {
                'results': data,
                'pagination': {
                    'count': self.page.paginator.count,
                    'page': self.page.number,
                    'page_size': self.page.paginator.per_page,
                    'total_pages': self.page.paginator.num_pages,
                    'has_next': self.page.has_next(),
                    'has_previous': self.page.has_previous(),
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link(),
                }
            },
            'message': '获取成功',
            'timestamp': 'created_at'
        })