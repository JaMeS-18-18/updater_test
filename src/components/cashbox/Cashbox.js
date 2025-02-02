import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Close, CloseOutlined } from '@material-ui/icons';
import { useSelector, useDispatch } from 'react-redux'
import { SET_UNSYNC_PRODUCTS } from 'store/actions/countUnsyncProducts'
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';

import { getHHmm } from 'helpers/helpers'
import Tab from './Tab'

function Cashbox() {
	const { t } = useTranslation();

  const dispatch = useDispatch()
  const countUnsyncProducts = useSelector(state => state.countUnsyncProducts)

  const [tabs, setTabs] = useState(localStorage.getItem('tabs') ? JSON.parse(localStorage.getItem('tabs')) : [{ 'id': 1, 'active': true, 'time': getHHmm() }])
  const [activeTabId, setActiveTabId] = useState(1)
  const [showConfirmModalDeleteItem, setShowConfirmModalDeleteItem] = useState({ 'bool': false, 'index': 0 });


  useEffect(() => {
    let tabs = JSON.parse(localStorage.getItem('tabs'))
    if (tabs) {
      tabs.map((item) => {
        if (item.active) {
          setActiveTabId(item.id)
        }
      })
    }
  }, [])



  function duplicate() {
    if (tabs.length <= 4) {
      var tabsCopy = [...tabs]
      for (let i = 0; i < tabsCopy.length; i++) {
        tabsCopy[i]['active'] = false
      }
      var randomNumber = Math.floor(Math.random() * 999999)
      tabsCopy.push({ 'id': randomNumber, 'active': true, 'time': getHHmm() })
      // console.log(tabsCopy);
      localStorage.setItem('tabs', JSON.stringify(tabsCopy))
      setActiveTabId(randomNumber)
      setTabs(tabsCopy)
    }
  }

  function deleteTab(index) {
    if (tabs.length !== 1) {
      let Cart = JSON.parse(localStorage.getItem('tabCheque'))
      if (Cart) {
        console.log(index);
        
        // let getDataIndex = Cart.findIndex(item => item.tabId == activeTabId)
        // if (getDataIndex) {
          Cart.splice(index, 1)
          localStorage.setItem('tabCheque', JSON.stringify(Cart))
        // }
      }
      var tabsCopy = [...tabs]
      if (index === 0) {
        for (let i = 0; i < tabsCopy.length; i++) {
          tabsCopy[i]['active'] = false
        }
        tabsCopy[index + 1]['active'] = true
      }

      var length = tabs.length
      if ((length - 1) === index) {
        for (let i = 0; i < tabsCopy.length; i++) {
          tabsCopy[i]['active'] = false
        }
        tabsCopy[index - 1]['active'] = true
      }


      tabsCopy.splice(index, 1);
      localStorage.setItem('tabs', JSON.stringify(tabsCopy))
      setTabs(tabsCopy)
      setShowConfirmModalDeleteItem({ 'bool': false, 'index': 0 })
    }
  }

  function setActiveTab(id) {
    var tabsCopy = [...tabs]
    for (let i = 0; i < tabsCopy.length; i++) {
      if (tabsCopy[i]['id'] === id) {
        setActiveTabId(tabsCopy[i]['id'])
        tabsCopy[i]['active'] = true
      } else {
        tabsCopy[i]['active'] = false
      }
    }
    localStorage.setItem('tabs', JSON.stringify(tabsCopy))
    setTabs(tabsCopy)
  }

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {t('out_of_sync')}
    </Tooltip>
  );

  useEffect(() => {
    window.electron.dbApi.getUnsyncCheques().then(response => {
      dispatch(SET_UNSYNC_PRODUCTS(response.length))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="cashbox-tabs d-flex">
        <ul className="p-0 m-0">
          {tabs.map((item, index) => (
            <li className="me-1" key={item.id}>
              <div className="tab-block grow-animation">
                <div onClick={() => setActiveTab(item.id)}>
                  <span className={"me-2 p-1 tab-number fz12 " + (item.active ? 'bg-primary' : 'bg-e0')}>{'0' + (index + 1)}</span>
                  <strong id="tab-time" className="me-2 tab-time fz12">
                    {item.time}
                    {/* {item.id} */}
                  </strong>
                </div>
                {tabs.length > 1 &&
                  <Close style={{ color: 'dc3545', fontSize: '1rem' }} onClick={() => setShowConfirmModalDeleteItem({ 'bool': true, 'index': index })} />
                }
              </div>
            </li>
          ))
          }

          <button className="btn-success no-border" onClick={duplicate} tabIndex="-1">+</button>
        </ul>
        <div className="theme-text-color">
          <OverlayTrigger placement="left" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
            <span>[{countUnsyncProducts}]</span>
          </OverlayTrigger>
        </div>
      </div>

      <div className="tab-content card-background">
        {tabs.map((item) => (
          <section key={item.id} style={item.active ? { 'display': 'block' } : { 'display': 'none' }}>
            <Tab tabId={item.id} activeTabId={item.active && item.id} />
          </section>
        ))
        }
      </div>

      {/* CONFIRM DELETE ONE PRODUCT MODAL */}
      <Modal show={showConfirmModalDeleteItem.bool} animation={false} centered dialogClassName="payment-terminal-modal-width" onHide={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={() => deleteTab(showConfirmModalDeleteItem.index)}>
                <h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
                <h5 className="color-62 my-3"><b>{t('delete')}?</b></h5>
                <div className="d-flex">
                  <button type="button" className="btn btn-danger w-100 me-4" onClick={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}>{t('cancel')}</button>
                  <button type="submit" id="confirmButton" className="btn btn-success w-100">{t('ok')}</button>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* CONFIRM DELETE ONE PRODUCT MODAL */}
    </>
  );
}

export default Cashbox;
