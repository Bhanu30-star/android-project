<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['gstin']))
{
	$session_dist_ver = $_POST['distributor_id'];
    $gstin = $_POST['gstin'];
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	
	$result_secret = mysqli_query($con, "SELECT * FROM `tbl_gst_api_auth_detail`");
    $row_secret = mysqli_fetch_array($result_secret);
    $cdate11  = date("Y-m-d") . " " . date("H:i:s");
    $rs_data = mysqli_query($con, "SELECT * FROM `tbl_distributor` WHERE distributor_id = '$session_dist_ver'");
    if (mysqli_num_rows($rs_data) > 0) 
	{
		$fetch_dis = mysqli_fetch_assoc($rs_data);

        $result_activation = mysqli_query($con, "SELECT * FROM `tbl_gst_api_activation` WHERE status = 'Active'");
        $fetch_activation = mysqli_fetch_array($result_activation);

        if ($fetch_activation['api_active'] == 'Chartered Information') 
		{
				$curl = curl_init();
                curl_setopt_array($curl, array(
                    CURLOPT_URL => 'https://gstapi.charteredinfo.com/commonapi/v1.1/search?aspid=1684392722&password=Jaipur%40123&Action=TP&SearchGstin=' . $gstin,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => '',
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 0,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => 'GET',
                    CURLOPT_HTTPHEADER => array(
                        'session-id: ' . $row_secret['session_id'],
                        'asp-secret: ' . $row_secret['asp_secret'],
                        'Gstin: ' . $row_secret['gstin'],
                        'txn: 123456'
                    ),
                ));
                $result = curl_exec($curl);
                curl_close($curl);
                $decoded_json_tkn = json_decode($result, true);
                if ($decoded_json_tkn["lgnm"] != '') {
                    $legalname = $decoded_json_tkn["lgnm"];
                    $tradename = $decoded_json_tkn["tradeNam"];
                    $array_check = $decoded_json_tkn["pradr"];
                    $pincode1 = $array_check["addr"]["pncd"];
                    $location1 = $array_check["addr"]["dst"];
                    $address1 = $array_check["addr"]["bno"] . ' ' . $array_check["addr"]["st"] . ' ' . $array_check["addr"]["loc"] . ' ' . $array_check["addr"]["dst"];
                    $placeofsupply = $array_check["addr"]["stcd"];
                }
       } else {
                $pcode = substr($pgstin, 0, 2);
                $curl = curl_init();
                curl_setopt_array($curl, array(
                    CURLOPT_URL => 'https://api.whitebooks.in/public/search?email=dy%40zucol.in&gstin=' . $gstin,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => '',
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 0,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => 'GET',
                    CURLOPT_HTTPHEADER => array(
                        'client_id: GSTP11891b32-b514-4b70-bd9d-a5b95d1f4d8d',
                        'client_secret: GSTP21ad6d76-410c-4ee3-bac9-758f517388b2'
                    ),
                ));
                $result = curl_exec($curl);
                curl_close($curl);
                $decoded_json_tkn = json_decode($result, true);
                if ($decoded_json_tkn['data']["lgnm"] != '') {
                    $verified = 'Yes';
                    $legalname = mysqli_real_escape_string($con, $decoded_json_tkn['data']["lgnm"]);
                    $tradename = mysqli_real_escape_string($con, $decoded_json_tkn['data']["tradeNam"]);
                    $array_check = $decoded_json_tkn['data']["pradr"];
                    $pincode1 = $array_check["addr"]["pncd"];
                    $location1 = $array_check["addr"]["dst"];
                    $placeofsupply = $array_check["addr"]["stcd"];
                    if ($array_check["addr"]["flno"] == '')
                        $address1 = $array_check["addr"]["bno"] . ' ' . $array_check["addr"]["st"] . ' ' . $array_check["addr"]["loc"] . ' ' . $array_check["addr"]["dst"];
                    else
                        $address1 = $array_check["addr"]["flno"] . ' ' . $array_check["addr"]["bno"] . ' ' . $array_check["addr"]["st"] . ' ' . $array_check["addr"]["loc"] . ' ' . $array_check["addr"]["dst"];
                }
      }
      if ($legalname != '') {

          $query = mysqli_query($con, "INSERT INTO `tbl_distributor_history`( `distributor_id`,`gstin_no`, `legal_name`, `trade_name`, `type_description`, `insert_datetime_val`, distributor_user_id,`pin_no`,`location`, distributor_address) VALUES ('$session_dist_ver','" . $fetch_dis['gstin_no'] . "','" . $fetch_dis['legal_name'] . "','" . $fetch_dis['trade_name'] . "','E-invoice Setting Changed','$cdate11','$dis_user_id','" . $fetch_dis['pin_code'] . "','" . $fetch_dis['Location'] . "','" . $fetch_dis['distributor_address'] . "')");
          if ($query) 
		  {
             $statecode = substr($gstin, 0, 2);
             $uq2 = mysqli_query($con, "UPDATE tbl_distributor set gstin_no='$gstin',update_datetime='$cdate11',legal_name='$legalname', trade_name='$tradename',place_of_supply='$placeofsupply',state_code='$statecode',pin_code='$pincode1',Location='$location1',distributor_address='$address1' where distributor_id='$session_dist_ver'");
			 $response['success']='1';
			 $response['message']="Your GSTIN No Successfully Verified!!";
		  }
		  else
		  {
				$response['success']='0';
				$response['message']="Your GSTIN No is not Verified!!";
		  }
	  }
	  else
	  {
		    $response['success']='0';
			$response['message']="Your GSTIN No is not Verified!!";
	  }
	}
	else
	{
		$response['success']='0';
		$response['message']="Your GSTIN No is not Verified!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>