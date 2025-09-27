import re

class TweeParser:
    def parse(self, content):
        passages = []
        lanes = [{'id': 'metadata', 'name': 'Metadata', 'isMetadata': True}]
        lane_map = {}

        passage_regex = r':: ([^\[]+)(?:\[([^\]]*)\])?\n([\s\S]*?)(?=\n:: |\n*$)'
        matches = re.finditer(passage_regex, content)

        passage_id = 1
        lane_id = 1

        for match in matches:
            title = match.group(1).strip()
            tags = match.group(2).strip() if match.group(2) else ''
            passage_content = match.group(3).strip()

            is_metadata = title == 'Start' or 'info' in tags

            if is_metadata:
                lane_name = 'Metadata'
            else:
                lane_name = tags if tags else 'Main'

                if lane_name not in lane_map:
                    lane = {
                        'id': f'lane_{lane_id}',
                        'name': lane_name,
                        'isMetadata': False
                    }
                    lanes.append(lane)
                    lane_map[lane_name] = f'lane_{lane_id}'
                    lane_id += 1

            passage = {
                'id': f'passage_{passage_id}',
                'title': title,
                'content': passage_content,
                'laneId': 'metadata' if is_metadata else lane_map.get(lane_name)
            }
            passages.append(passage)
            passage_id += 1

        return {
            'passages': passages,
            'lanes': lanes
        }


class TweeExporter:
    def export(self, data):
        twee_content = []

        passages = data.get('passages', [])
        lanes = {lane['id']: lane for lane in data.get('lanes', [])}

        for passage in passages:
            lane = lanes.get(passage.get('laneId', ''))
            tags = ''

            if lane and not lane.get('isMetadata', False):
                tags = f"[{lane['name']}]"

            title = passage.get('title', 'Untitled')
            content = passage.get('content', '')

            twee_content.append(f":: {title}{tags}\n{content}\n")

        return '\n'.join(twee_content)