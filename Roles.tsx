import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import CustomGrid from '@features/common/custom-grid/CustomGrid';
import {
  Checkbox,
  Dropdown,
  DropdownItem,
  Input,
  Modal,
  ModalBody,
  Button,
  Tooltip,
} from '@ascend-portal/eds-react-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiInterceptor } from '@/app/utilities/utils';
import {
  ASCEND_ADMIN_GET_ALL_ROLEACCESS,
  ASCEND_ADMIN_CREATE_ROLEACCESS,
  ASCEND_ADMIN_DELETE_ROLEACCESS,
  ASCEND_ADMIN_UPDATE_ROLEACCESS,
} from '@/app/redux/constants/api-constants';
import NotificationHelper from '@features/common/controls/NotificationHelper';
import Loader from '@features/common/controls/Loader';
import { getUserInfo, setUserInfo } from '@/app/auth/auth-utils';
import { AxiosResponse } from 'axios';

const btnGrpStyles = {
  float: 'right',
  margin: '10px 10px 5px',
} as CSSProperties;

interface IRoleData {
  access: string[];
  name: string;
  _id: string;
}

interface IAccesses {
  description: string;
  name: string;
  section: string;
}

interface IDataItem {
  title: string;
  data: string;
}

interface IRowData {
  description: string;
  name: string;
  section: string;
}

interface IColumnData {
  title: string;
  data: string;
}

const Roles: FC = () => {
  const [accesses, setaccesses] = useState<IAccesses[]>([]);
  const [roles, setroles] = useState<IRoleData[]>([]);
  const [columns, setcolumns] = useState([]);
  const [rows, setrows] = useState([]);
  const [modalVisible, setmodalVisible] = useState(false as boolean);
  const [deleteModalVisible, setdeleteModalVisible] = useState(
    false as boolean,
  );
  const [roleName, setroleName] = useState('' as string);
  const [deleteDataItem, setdeleteDataItem] = useState({} as IDataItem);
  const [dropdownText, setdropdownText] = useState(
    'Inherit from Existing Role' as string,
  );
  const [dropdownRowItem, setdropdownRowItem] = useState({} as IRoleData);
  const [roleNameError, setroleNameError] = useState('' as string);

  const [nh_notify, setNh_Notify] = useState<boolean>(false);
  const [nh_notifyMsg, setnh_notifyMsg] = useState<string>('');
  const [motif, setmotif] = useState<
    'success' | 'info' | 'warning' | 'error'
  >();
  const [nh_loading, setNh_Loading] = useState<boolean>(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getRoleAccesses = useCallback(() => {
    setNh_Loading(true);
    ApiInterceptor(`${ASCEND_ADMIN_GET_ALL_ROLEACCESS}`, 'GET')
      .then((response: AxiosResponse) => {
        if (!isMountedRef.current) return;
        const userInfo = getUserInfo();
        const roleData = response.data.data?.roleData?.filter(
          (role) => role.name === userInfo?.role,
        );
        const userData = {
          ...userInfo,
          roleAccess: roleData[0]?.access,
        };
        setUserInfo(JSON.stringify(userData));
        setaccesses(response.data.data.accesses);
        setroles(response.data.data.roleData);
        setNh_Loading(false);
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        console.log('err', error);
        showNotificationHanlder(true, 'error', 'Failed to load Information');
      });
  }, []);

  useEffect(() => {
    getRoleAccesses();
  }, [getRoleAccesses]);

  useEffect(() => {
    const ColumnComponent = ({ dataItem, access, roleData }) => {
      const itemData = roleData.filter(
        (role: IRoleData) => role.name === dataItem.data,
      );
      const [columnChecked, setcolumnChecked] = useState(
        accesses.length === itemData[0].access.length,
      );

      const handleChangeItem = (e) => {
        setcolumnChecked(e.target.checked);
        let checkedItemArray = [...roleData];
        if (e.target.checked) {
          const updateData = roleData.map((item: IRoleData) => {
            if (item.name === dataItem.data) {
              const totalAccess =
                access.length &&
                access.map((accessItem: IAccesses) => accessItem.name);
              item['access'] = [...totalAccess];
            }
            return item;
          });
          checkedItemArray = [...updateData];
        } else {
          const updateData = roleData.map((item: IRoleData) => {
            if (item.name === dataItem.data) {
              item['access'] = [];
            }
            return item;
          });
          checkedItemArray = [...updateData];
        }
        setroles(checkedItemArray);
      };

      const deleteModalHandler = () => {
        setdeleteModalVisible(true);
        setdeleteDataItem(dataItem);
      };

      return (
        <span className="column_comp roles">
          <Checkbox
            checked={columnChecked}
            name={dataItem.title}
            id={`ctrl-${dataItem.title}`}
            onChange={(e) => handleChangeItem(e)}
          />
          <span>{dataItem.title}</span>
          <Tooltip content="Delete Role" placement="left">
            <FontAwesomeIcon icon={faTimes} onClick={deleteModalHandler} />
          </Tooltip>
        </span>
      );
    };
    const columnData = [
      {
        data: 'description',
        title: 'Role Description',
        fixed: true,
        width: '200px',
        left: '0px',
      },
      {
        data: 'name',
        title: 'Role Name',
        fixed: true,
        width: '400px',
        left: '200px',
      },
      {
        data: 'section',
        title: 'Section',
        fixed: true,
        width: '250px',
        left: '600px',
      },
    ];
    const RoleaccessCheck = (row: IRowData, column: IColumnData) => {
      return <RoleaccessCheckData row={row} column={column} roleData={roles} />;
    };

    const ColumnComponentCheck = (dataItem: IDataItem) => {
      return (
        <ColumnComponent
          dataItem={dataItem}
          access={accesses}
          roleData={roles}
        />
      );
    };

    const roleItems = roles.map((role: { name: string }) => {
      return {
        data: role.name,
        title: role.name,
        component: RoleaccessCheck,
        columnComponent: ColumnComponentCheck,
      };
    });
    setcolumns([...columnData, ...roleItems]);
    setrows(accesses);
    setdropdownText('Inherit from Existing Role');
    setdropdownRowItem(null);
  }, [roles, accesses]);

  const handleAddRole = () => {
    setmodalVisible(true);
  };

  const handleModalClose = () => {
    setmodalVisible(false);
    setdeleteModalVisible(false);
    setroleName('');
    setdropdownText('Inherit from Existing Role');
    setdropdownRowItem(null);
    setroleNameError('');
  };

  const handleNameChangeHandler = (e) => {
    const { value } = e.target;
    setroleName(value);
    if (!value) {
      return setroleNameError('Please Enter the Role Name');
    }
    setroleNameError('');
  };

  const RoleaccessCheckData = ({ row, column, roleData }) => {
    const [checkedItems, setcheckedItems] = useState([]);
    const [checked, setchecked] = useState(false);

    useEffect(() => {
      setcheckedItems(roleData);
      const itemRole =
        roleData.length &&
        roleData.filter((roleItem) => roleItem.name === column.data);
      const indexNumber =
        itemRole.length &&
        itemRole[0].access &&
        itemRole[0].access.indexOf(row.name);
      setchecked(indexNumber >= 0);
    }, [column.data, roleData, row.name]);

    const handleChange = (e) => {
      setchecked(e.target.checked);
      let roleDataValues = [...checkedItems];

      if (e.target.checked) {
        const updateData = roleDataValues.map((item: IRoleData) => {
          if (item.name === column.data) {
            if (!item['access'].includes(row.name)) {
              item['access'].push(row.name);
            }
          }
          return item;
        });
        roleDataValues = [...updateData];
      } else {
        const updateData = roleDataValues.map((item: IRoleData) => {
          if (item.name === column.data) {
            const newList =
              item['access'].length &&
              item['access'].filter(
                (role) => role.localeCompare(row.name) !== 0,
              );
            item['access'] = [...newList];
          }
          return item;
        });
        roleDataValues = [...updateData];
      }
      setcheckedItems(roleDataValues);
      setroles(roleDataValues);
    };
    return (
      <Checkbox
        checked={checked}
        name={row.name}
        id={`ctrl-${row.name}`}
        onChange={handleChange}
      />
    );
  };

  const handleCreateAccess = () => {
    const data = { name: roleName, access: dropdownRowItem?.access };
    if (!roleName) {
      return setroleNameError('Please Enter the Role Name');
    }
    ApiInterceptor(`${ASCEND_ADMIN_CREATE_ROLEACCESS}`, 'POST', null, data)
      .then((response: AxiosResponse) => {
        if (!isMountedRef.current) return;
        setmodalVisible(false);
        setroleName('');
        showNotificationHanlder(
          true,
          'success',
          'Role access created successfully',
        );
        getRoleAccesses();
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        console.log('err', error);
        setmodalVisible(false);
        setroleName('');
        showNotificationHanlder(true, 'error', 'Failed to create role');
      });
  };

  const handleSaveAccess = () => {
    const roleObject = roles.map((item) => {
      const dataObj = {};
      dataObj[item.name] = item.access;
      return dataObj;
    });
    const data = {};
    for (let index = 0; index < roleObject.length; index++) {
      Object.assign(data, roleObject[index]);
    }

    ApiInterceptor(`${ASCEND_ADMIN_UPDATE_ROLEACCESS}`, 'POST', null, data)
      .then((response: AxiosResponse) => {
        if (!isMountedRef.current) return;
        showNotificationHanlder(
          true,
          'success',
          'Role access updations saved successfully',
        );
        getRoleAccesses();
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        showNotificationHanlder(
          true,
          'error',
          'Failed to update the role access.',
        );
        console.log('err', error);
      });
  };

  const handleDeleteRoleAccess = () => {
    const data = { name: deleteDataItem.data };

    ApiInterceptor(`${ASCEND_ADMIN_DELETE_ROLEACCESS}`, 'POST', null, data)
      .then((response: AxiosResponse) => {
        if (!isMountedRef.current) return;
        setdeleteModalVisible(false);
        showNotificationHanlder(
          true,
          'success',
          'Role access deleted successfully',
        );
        getRoleAccesses();
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        console.log('err', error);
        showNotificationHanlder(true, 'success', 'Failed to Delete role.');
        setdeleteModalVisible(false);
      });
  };

  const handleSetExistingRole = (rowItem) => {
    setdropdownText(rowItem.name);
    setdropdownRowItem(rowItem);
  };

  const setShownotification = (flag: boolean) => setNh_Notify(flag);

  const showNotificationHanlder = (
    showNotification: boolean,
    notificationType: 'success' | 'info' | 'warning' | 'error',
    labelText: string,
  ) => {
    setNh_Loading(false);
    setNh_Notify(showNotification);
    setnh_notifyMsg(labelText);
    setmotif(notificationType);
  };

  return (
    <>
      {nh_loading && (
        <Loader showLoader={nh_loading} loadertext="Loading Data..." />
      )}
      <div className="adminpanel_roles">
        <NotificationHelper
          loading={false}
          notify={nh_notify}
          notifyMsg={nh_notifyMsg}
          motif={motif}
          setShownotification={setShownotification}
        />
        <div className="report-tabs">
          <div className="btn-group roles-btn-group" style={btnGrpStyles}>
            <Tooltip content="Save the changes made">
              <Button
                onClick={handleSaveAccess}
                id="btn_refresh"
                color="primary"
                style={{ marginRight: '10px' }}
              >
                <Button.Icon>
                  <FontAwesomeIcon icon={faSave} />
                </Button.Icon>
                <Button.Label>Save Accesses</Button.Label>
              </Button>
            </Tooltip>
            <Tooltip content="Add new Role">
              <Button
                onClick={handleAddRole}
                id="btn_load_more"
                color="primary"
              >
                <Button.Icon>
                  <FontAwesomeIcon icon={faPlus} />
                </Button.Icon>
                <Button.Label>Add Role</Button.Label>
              </Button>
            </Tooltip>
          </div>
          {!nh_loading && (
            <CustomGrid
              rows={rows}
              columns={columns}
              showButtons={false}
              showSearchFiled={false}
            />
          )}
        </div>
        <Modal
          show={modalVisible}
          heading="Role Addition"
          iconComponent={
            <Tooltip content="Close Modal">
              <FontAwesomeIcon icon={faTimes} />
            </Tooltip>
          }
          isClose={true}
          isHeading={true}
          handleClose={handleModalClose}
          btnGroup={[
            {
              label: <Tooltip content="Create Role">Create</Tooltip>,
              className: 'createRole',
              color: 'primary',
              onClick: handleCreateAccess,
            },
            {
              label: <Tooltip content="Cancel Creation">Cancel</Tooltip>,
              className: 'cancel',
              color: 'danger',
              onClick: handleModalClose,
            },
          ]}
          footerAlign="right"
        >
          <ModalBody>
            <label>
              <Tooltip content="Role Name which has to be created">
                Role name
              </Tooltip>
            </label>
            <Input
              type="text"
              name="roleName"
              id="roleName"
              placeholder="Role Name"
              onChange={handleNameChangeHandler}
              value={roleName}
              style={{ marginBottom: '15px' }}
            />

            <Dropdown
              id="myID"
              label={
                <Tooltip content="Select Role">
                  Inherit from Existing Role
                </Tooltip>
              }
              text={dropdownText}
              width="300px"
            >
              {roles &&
                roles.length &&
                roles.map((role, index) => {
                  return (
                    <DropdownItem id="item1" key={index}>
                      <span onClick={() => handleSetExistingRole(role)}>
                        {role.name}
                      </span>
                    </DropdownItem>
                  );
                })}
            </Dropdown>
          </ModalBody>
        </Modal>
        <Modal
          show={deleteModalVisible}
          heading="Role Deletion"
          iconComponent={
            <Tooltip content="Close Modal">
              <FontAwesomeIcon icon={faTimes} />
            </Tooltip>
          }
          isClose={true}
          isHeading={true}
          handleClose={handleModalClose}
          btnGroup={[
            {
              label: <Tooltip content="Delete Role">Delete</Tooltip>,
              className: 'deleteRole',
              color: 'primary',
              onClick: handleDeleteRoleAccess,
            },
            {
              label: <Tooltip content="Cancel Deletion">Cancel</Tooltip>,
              className: 'cancel',
              color: 'danger',
              onClick: handleModalClose,
            },
          ]}
          footerAlign="right"
        >
          <ModalBody>
            <div>
              <p>
                Are you sure you want to delete role
                <strong>
                  <em> {deleteDataItem.data}</em>
                </strong>
                ?
              </p>
            </div>
          </ModalBody>
        </Modal>
      </div>
    </>
  );
};

export default Roles;
