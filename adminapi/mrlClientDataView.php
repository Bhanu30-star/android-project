<?php

include("../../connect.php");

$method = $_SERVER['REQUEST_METHOD'];
$todayDate = date('d');
if ($method == 'POST') { 
  if(empty($_REQUEST)){
    echo json_encode(['result' => false, 'msg' => 'Parameter Missing', 'data' => null]);
  }
  else if(!empty($_REQUEST) && array_keys($_REQUEST)[0] == 'client_id' && $_REQUEST['client_id']!=''){
    $client_id = $_REQUEST['client_id'];
    $arr_data = [];
    $final_mrl = [];
    $check_clientId = mysqli_query($con, "SELECT * FROM `tbl_btcw_auditor` WHERE distributor_id ='$client_id' AND status='Approved'");
    if (mysqli_num_rows($check_clientId) > 0) {
      $fetch_data = mysqli_fetch_assoc($check_clientId);
      $select_mrl = mysqli_query($con,"SELECT * FROM `tbl_btcw_auditor_mrl_data` WHERE audit_id = '".$fetch_data['id']."' AND distributor_id='$client_id'");
      if(mysqli_num_rows($select_mrl) > 0){
        $fetch_mrl = mysqli_fetch_assoc($select_mrl);
        $arr_data['ca_name'] = $fetch_mrl['ca_name'];
        $arr_data['closing_stock'] = $fetch_mrl['closing_stock'];
        $arr_data['cash_balance'] = $fetch_mrl['cash_balance'];
        $arr_data['annexures'] = $fetch_mrl['annexures'];
        array_push($final_mrl,$arr_data);
        echo json_encode(['result' => true, 'msg' => 'Data Founded.', 'data' => $final_mrl]);
      }else{
        echo json_encode(['result' => false, 'msg' => 'Client MRL Data Not Available.', 'data' => null]);
      }
    }
    else{
      echo json_encode(['result' => false, 'msg' => 'Client Audit Not Submitted.', 'data' => null]);
    }
  }
  else if(!empty($_REQUEST) && array_keys($_REQUEST)[0] == 'client_id' && $_REQUEST['client_id']==''){
    echo json_encode(['result' => false, 'msg' => 'Client Id is Missing.', 'data' => null]);
  }
  else if(!empty($_REQUEST) && array_keys($_REQUEST)[0] != 'client_id'){
    echo json_encode(['result' => false, 'msg' => 'Parameter is Wrong.', 'data' => null]);
  }
}
else{
  echo json_encode(['result' => false, 'msg' => 'Parameter Missing.', 'data' => null]);
}
