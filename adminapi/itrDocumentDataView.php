<?php

include("../../connect.php");

$method = $_SERVER['REQUEST_METHOD'];
$todayDate = date('d');
if ($method == 'POST') {
  if (empty($_REQUEST)) {
    echo json_encode(['result' => false, 'msg' => 'Parameter Missing', 'data' => null]);
  } else if (!empty($_REQUEST) && array_keys($_REQUEST)[0] == 'client_id' && $_REQUEST['client_id'] != '' && $_REQUEST['fy'] != '') {
    $client_id = $_REQUEST['client_id'];

    $fy = $_REQUEST['fy'];
    $split_fy = explode("-", $fy);
    $arr_data = [];
    $arr_document = [];
    $final_itr_doc = [];

    $document1 = array('doc' => 'ITR Acknowledgment', 'link' => '', 'flag' => 'no', 'call_request' => 'itr_acknowledgment', 'request_status' => 'not requested');
    $document2 = array('doc' => 'Audit Report', 'link' => '', 'flag' => 'no', 'call_request' => 'audit_report', 'request_status' => 'not requested');
    $document3 = array('doc' => 'Balance Sheet', 'link' => '', 'flag' => 'no', 'call_request' => 'balance_sheet', 'request_status' => 'not requested');
    $document4 = array('doc' => 'Profit & Loss', 'link' => '', 'flag' => 'no', 'call_request' => 'profit_loss', 'request_status' => 'not requested');
    $document5 = array('doc' => 'Computation', 'link' => '', 'flag' => 'no', 'call_request' => 'computation', 'request_status' => 'not requested');

    $select_relationship = mysqli_query($con, "SELECT onborad_by_partner FROM `tbl_distributor` WHERE distributor_id='$client_id'");
    if (mysqli_num_rows($select_relationship) > 0) {
      $fetch_relationship = mysqli_fetch_assoc($select_relationship);
      if ($fetch_relationship['onborad_by_partner'] != 0 && $fetch_relationship['onborad_by_partner'] != '') {
        $query_rel_name =  mysqli_query($con, "SELECT admin_name, official_phoneno FROM `tbl_admin_panel` WHERE admin_id='" . $fetch_relationship['onborad_by_partner'] . "'");
        $fetch_rel_name = mysqli_fetch_assoc($query_rel_name);
        $rel_manager_name =  $fetch_rel_name['admin_name'];
        $rel_manager_number =  $fetch_rel_name['official_phoneno'];
      } else {
        $rel_manager_name =  'NA';
        $rel_manager_number =  'NA';
      }
    }

    $select_compliance = mysqli_query($con, "SELECT admin_id FROM `tbl_gstr_detail` WHERE distributor_id='$client_id' AND Status='Assign' ORDER BY gstr_id Desc");
    if (mysqli_num_rows($select_compliance) > 0) {
      $fetch_compliance = mysqli_fetch_assoc($select_compliance);
      if ($fetch_compliance['admin_id'] != 0 && $fetch_compliance['admin_id'] != '') {
        $query_comp_name =  mysqli_query($con, "SELECT admin_name, official_phoneno FROM `tbl_admin_panel` WHERE admin_id='" . $fetch_compliance['admin_id'] . "'");
        $fetch_comp_name = mysqli_fetch_assoc($query_comp_name);
        $comp_manager_name = $fetch_comp_name['admin_name'];;
        $comp_manager_number = $fetch_comp_name['official_phoneno'];
      } else {
        $comp_manager_name = 'NA';
        $comp_manager_number = 'NA';
      }
    } else {
      $comp_manager_name = 'NA';
      $comp_manager_number = 'NA';
    }

    $check_itr_doc = mysqli_query($con, "SELECT * FROM `tbl_btcw_itr_documents_data` WHERE client_id ='$client_id' AND fy='$fy'");
    if (mysqli_num_rows($check_itr_doc) > 0) {
      $fetch_itr_data = mysqli_fetch_assoc($check_itr_doc);

      $check_request = mysqli_query($con, "SELECT * FROM `tbl_btcw_itr_app_call_request` WHERE client_id ='$client_id' AND fy='$fy'");
      if (mysqli_num_rows($check_request) > 0) {
        while ($fetch_request = mysqli_fetch_assoc($check_request)) {
          if ($fetch_request['doc_name'] == 'itr_acknowledgment') {
            $document1['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'audit_report') {
            $document2['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'balance_sheet') {
            $document3['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'profit_loss') {
            $document4['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'computation') {
            $document5['request_status'] = 'requested';
          }
        }
      }

      if ($fetch_itr_data['itr_acknowledgment'] != '') {
        $doc1 = 'https://btconnect.in/' . $fetch_itr_data['itr_acknowledgment'];
        $document1['link'] = $doc1;
        $document1['flag'] = 'yes';
        array_push($arr_document, $document1);
      } else {
        $document1['link'] = '';
        $document1['flag'] = 'no';
        array_push($arr_document, $document1);
      }

      if ($fetch_itr_data['audit_report'] != '') {
        $doc2 = 'https://btconnect.in/' . $fetch_itr_data['audit_report'];
        $document2['link'] = $doc2;
        $document2['flag'] = 'yes';
        array_push($arr_document, $document2);
      } else {
        $document2['link'] = '';
        $document2['flag'] = 'no';
        array_push($arr_document, $document2);
      }

      if ($fetch_itr_data['balance_sheet'] != '') {
        $doc3 = 'https://btconnect.in/' . $fetch_itr_data['balance_sheet'];
        $document3['link'] = $doc3;
        $document3['flag'] = 'yes';
        array_push($arr_document, $document3);
      } else {
        $document3['link'] = '';
        $document3['flag'] = 'no';
        array_push($arr_document, $document3);
      }

      if ($fetch_itr_data['profit_loss'] != '') {
        $doc4 = 'https://btconnect.in/' . $fetch_itr_data['profit_loss'];
        $document4['link'] = $doc4;
        $document4['flag'] = 'yes';
        $document4['call_request'] = 'profit_loss';
        array_push($arr_document, $document4);
      } else {
        $document4['link'] = '';
        $document4['flag'] = 'no';
        $document4['call_request'] = 'profit_loss';
        array_push($arr_document, $document4);
      }

      if ($fetch_itr_data['computation'] != '') {
        $doc5 = 'https://btconnect.in/' . $fetch_itr_data['computation'];
        $document5['link'] = $doc5;
        $document5['flag'] = 'yes';
        $document5['call_request'] = 'computation';
        array_push($arr_document, $document5);
      } else {
        $document5['link'] = '';
        $document5['flag'] = 'no';
        $document5['call_request'] = 'computation';
        array_push($arr_document, $document5);
      }

      $arr_data['result'] = true;
      $arr_data['msg'] = 'Data Founded.';
      $arr_data['compliance_manager'] = $comp_manager_name;
      $arr_data['compliance_number'] = $comp_manager_number;
      $arr_data['relationship_manager'] = $rel_manager_name;
      $arr_data['relationship_number'] = $rel_manager_number;
      $arr_data['document'] = $arr_document;

      echo json_encode($arr_data);
    } else {
      $check_request = mysqli_query($con, "SELECT * FROM `tbl_btcw_itr_app_call_request` WHERE client_id ='$client_id' AND fy='$fy'");
      if (mysqli_num_rows($check_request) > 0) {
        while ($fetch_request = mysqli_fetch_assoc($check_request)) {
          if ($fetch_request['doc_name'] == 'itr_acknowledgment') {
            $document1['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'audit_report') {
            $document2['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'balance_sheet') {
            $document3['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'profit_loss') {
            $document4['request_status'] = 'requested';
          }

          if ($fetch_request['doc_name'] == 'computation') {
            $document5['request_status'] = 'requested';
          }
        }
      }
      array_push($arr_document, $document1);
      array_push($arr_document, $document2);
      array_push($arr_document, $document3);
      array_push($arr_document, $document4);
      array_push($arr_document, $document5);


      $arr_data['result'] = true;
      $arr_data['msg'] = 'ITR Doc Not Founded.';
      $arr_data['compliance_manager'] = $comp_manager_name;
      $arr_data['compliance_number'] = $comp_manager_number;
      $arr_data['relationship_manager'] = $rel_manager_name;
      $arr_data['relationship_number'] = $rel_manager_number;
      $arr_data['document'] = $arr_document;

      echo json_encode($arr_data);
    }
  } else if (!empty($_REQUEST) && array_keys($_REQUEST)[0] == 'client_id' && $_REQUEST['client_id'] == '') {
    echo json_encode(['result' => false, 'msg' => 'Client Id is Missing.', 'data' => null]);
  } else if (!empty($_REQUEST) && array_keys($_REQUEST)[1] == 'fy' && $_REQUEST['fy'] == '') {
    echo json_encode(['result' => false, 'msg' => 'Financial Year is Missing.', 'data' => null]);
  } else if (!empty($_REQUEST) && (array_keys($_REQUEST)[0] != 'client_id' || array_keys($_REQUEST)[1] != 'fy')) {
    echo json_encode(['result' => false, 'msg' => 'Parameter is Wrong.', 'data' => null]);
  }
} else {
  echo json_encode(['result' => false, 'msg' => 'Parameter Missing.', 'data' => null]);
}
