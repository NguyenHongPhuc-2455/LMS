import { useRef, useState } from 'react';
import { Space, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { InputRef, TableColumnType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import styles from '../UserManagement.module.scss';

interface RoleData {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    full_name: string;
    avatar?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    bio?: string;
    roles: RoleData[];
    created_at: string;
    updated_at: string;
    enrollments_count: number;
    enrolled_courses: string[];
}

type DataIndex = keyof UserData;

export function useUserTableColumns() {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<UserData> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div className={styles.filterDropdownContainer} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    className={styles.filterInput}
                />
                <Space>
                    <Button type="primary" onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)} icon={<SearchOutlined />} size="small" className={styles.filterBtns}>Tìm</Button>
                    <Button onClick={() => { if (clearFilters) clearFilters(); setSelectedKeys?.([]); confirm(); }} size="small" className={styles.filterBtns}>Xóa</Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => record[dataIndex] ? record[dataIndex]!.toString().toLowerCase().includes((value as string).toLowerCase()) : false,
        render: (text) => searchedColumn === dataIndex ? (
            <Highlighter highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }} searchWords={[searchText]} autoEscape textToHighlight={text ? text.toString() : ''} />
        ) : (text),
    });

    return { getColumnSearchProps };
}
