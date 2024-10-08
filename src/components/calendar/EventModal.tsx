import React from 'react';
import { Modal, Form, Input, DatePicker, Select, Checkbox } from 'antd';
import { useCalendar, useHousehold } from '../../hooks';
import { Event, EventStatus, EventRecurrence, EventCategory } from '../../types/event';

interface EventModalProps {
  isVisible: boolean;
  onClose: () => void;
  eventData?: Partial<Event>;
}

const EventModal: React.FC<EventModalProps> = ({ isVisible, onClose, eventData }) => {
  const { addEvent, updateEvent } = useCalendar();
  const { currentHousehold } = useHousehold();
  const [form] = Form.useForm();

  const handleSubmit = (values: Partial<Event>) => {
    if (eventData?.id) {
      updateEvent(currentHousehold.id, eventData.id, values);
    } else {
      addEvent(currentHousehold.id, values);
    }
    onClose();
  };

  return (
    <Modal 
      visible={isVisible} 
      onCancel={onClose} 
      onOk={() => form.submit()}
      title={eventData ? "Edit Event" : "Create Event"}
    >
      <Form 
        form={form}
        initialValues={eventData}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item name="title" label="Event Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
          <DatePicker showTime />
        </Form.Item>
        <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
          <DatePicker showTime />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select>
            {Object.values(EventCategory).map(category => (
              <Select.Option key={category} value={category}>{category}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="recurrence" label="Recurrence" rules={[{ required: true }]}>
          <Select>
            {Object.values(EventRecurrence).map(recurrence => (
              <Select.Option key={recurrence} value={recurrence}>{recurrence}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="isAllDay" valuePropName="checked">
          <Checkbox>All Day Event</Checkbox>
        </Form.Item>
        <Form.Item name="location" label="Location">
          <Input />
        </Form.Item>
        <Form.Item name="isPrivate" valuePropName="checked">
          <Checkbox>Private Event</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventModal;