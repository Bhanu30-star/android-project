<?php
include("../../connect.php");
$response = array();
if (isset($_POST['gstin'])) {
	$pgstin = $_POST['gstin'];
	$stateCode = substr($pgstin, 0, 2);
	$getStateName = mysqli_query($con, "SELECT state_code, state_name FROM `tbl_state_master` WHERE state_code = '$stateCode'");
	$fetchStateName = mysqli_fetch_assoc($getStateName);
	$legalname = $tradename = $pincode1 = $location1 = $baddress1 = '';
	
	if ($pgstin != '') 
	{
		$result_activation = mysqli_query($con, "select * from tbl_gst_api_activation where status='Active'");
		$fetch_activation = mysqli_fetch_array($result_activation);
		
		if($fetch_activation['api_active']=='Chartered Information')
		{
			$result_secret = mysqli_query($con,"select * from tbl_gst_api_auth_detail");
			$row_secret = mysqli_fetch_array($result_secret);
			$oldurl='https://gstapi.charteredinfo.com/';
			$pcode=substr($pgstin,0,2);
			$curl = curl_init();
			curl_setopt_array($curl, array(
			  CURLOPT_URL => 'https://einvapimum1.charteredinfo.com/commonapi/v1.1/search?aspid=1684392722&password=Jaipur%40123&Action=TP&SearchGstin='.$pgstin,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => '',
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => 'GET',
			  CURLOPT_HTTPHEADER => array(
				'session-id: '.$row_secret['session_id'],
				'asp-secret: '.$row_secret['asp_secret'],
				'Gstin: '.$row_secret['gstin'],
				'txn: 123456'
			  ),
			));
			$result = curl_exec($curl);
			curl_close($curl);
			$decoded_json_tkn = json_decode($result, true);
			// echo $decoded_json_tkn;
			if($decoded_json_tkn["error"]["message"]!='')
			{
				$curl = curl_init();
				curl_setopt_array($curl, array(
					CURLOPT_URL => 'https://api.whitebooks.in/public/search?email=dy%40zucolsolutions.com&gstin='.$pgstin,
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
				
				if($decoded_json_tkn['data']["lgnm"]!='')
				{
					$verified='Yes';
					$legalname = mysqli_real_escape_string($con,$decoded_json_tkn['data']["lgnm"]);
					$tradename = mysqli_real_escape_string($con,$decoded_json_tkn['data']["tradeNam"]);
					$array_check=$decoded_json_tkn['data']["pradr"];
					$pincode1=$array_check["addr"]["pncd"];
					$location1=$array_check["addr"]["dst"];
					$pstate=$array_check["addr"]["stcd"];
					if($array_check["addr"]["flno"]!='')
					{
						$baddress1=$array_check["addr"]["flno"];
						if($array_check["addr"]["bnm"]!='')
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bnm"];
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
						else
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
					}
					else
					{
						if($array_check["addr"]["bnm"]!='')
						{
							$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["bnm"].', '.$array_check["addr"]["st"];
						}
						else
						{
							$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
					}
					
					if($array_check["addr"]["landMark"]!='')
						$baddress1=$baddress1.', '.$array_check["addr"]["landMark"];
					$baddress1=$baddress1.', '.$array_check["addr"]["loc"].', '.$array_check["addr"]["dst"].', '.$array_check["addr"]["stcd"].', '.$array_check["addr"]["pncd"];
				}
				else
				{
					$errormsg=$result;
				}
				
			}
			else
			{
				if($decoded_json_tkn["lgnm"]!='')
				{
					$verified='Yes';
					$legalname = mysqli_real_escape_string($con,$decoded_json_tkn["lgnm"]);
					$tradename = mysqli_real_escape_string($con,$decoded_json_tkn["tradeNam"]);
					$array_check=$decoded_json_tkn["pradr"];
					$pincode1=$array_check["addr"]["pncd"];
					$location1=$array_check["addr"]["dst"];
					$pstate=$array_check["addr"]["stcd"];
					if($array_check["addr"]["flno"]!='')
					{
						$baddress1=$array_check["addr"]["flno"];
						if($array_check["addr"]["bnm"]!='')
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bnm"];
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
						else
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
					}
					else
					{
						if($array_check["addr"]["bnm"]!='')
						{
							$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["bnm"].', '.$array_check["addr"]["st"];
						}
						else
						{
							$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
					}
					if($array_check["addr"]["landMark"]!='')
						$baddress1=$baddress1.', '.$array_check["addr"]["landMark"];
					$baddress1=$baddress1.', '.$array_check["addr"]["loc"].', '.$array_check["addr"]["dst"].', '.$array_check["addr"]["stcd"].', '.$array_check["addr"]["pncd"];
					
				}
				else
				{
					$errormsg=$result;
				}
			}
		}
		else
		{
			$pcode=substr($pgstin,0,2);
			$curl = curl_init();
			curl_setopt_array($curl, array(
				CURLOPT_URL => 'https://api.whitebooks.in/public/search?email=dy%40zucolsolutions.com&gstin='.$pgstin,
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
			if($decoded_json_tkn['data']["lgnm"]!='')
			{
				$verified='Yes';
				$legalname = mysqli_real_escape_string($con,$decoded_json_tkn['data']["lgnm"]);
				$tradename = mysqli_real_escape_string($con,$decoded_json_tkn['data']["tradeNam"]);
				$array_check=$decoded_json_tkn['data']["pradr"];
				$pincode1=$array_check["addr"]["pncd"];
				$location1=$array_check["addr"]["dst"];
				$pstate=$array_check["addr"]["stcd"];
				if($array_check["addr"]["flno"]!='')
				{
						$baddress1=$array_check["addr"]["flno"];
						if($array_check["addr"]["bnm"]!='')
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bnm"];
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
						else
						{
							$baddress1=$baddress1.', '.$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
						}
				}
				else
				{
					if($array_check["addr"]["bnm"]!='')
					{
						$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["bnm"].', '.$array_check["addr"]["st"];
					}
					else
					{
						$baddress1=$array_check["addr"]["bno"].', '.$array_check["addr"]["st"];
					}
				}
				if($array_check["addr"]["landMark"]!='')
					$baddress1=$baddress1.', '.$array_check["addr"]["landMark"];
				$baddress1=$baddress1.', '.$array_check["addr"]["loc"].', '.$array_check["addr"]["dst"].', '.$array_check["addr"]["stcd"].', '.$array_check["addr"]["pncd"];

				
			}
			else
			{
				$errormsg=$result;
			}
		}
	
	
		$legalname1 = str_replace("'", "", $legalname);
		$tradename1 = str_replace("'", "", $tradename);
		$legalname2 = str_replace("\\", "", $legalname1);
		$tradename2 = str_replace("\\", "", $tradename1);
		
		$response['legalname']= $legalname2;
		if($tradename==''){
			$response['tradename']= $legalname2;
		}else{
			$response['tradename']= $tradename2;
		}
		$response['pincode1']= $pincode1;
		$response['pstate']= $pcode.' - '.$pstate;
		$response['location1']= $location1;
		$response['paddress']= $baddress1;
		if($errormsg!=''){
			$response['errormsg'] = json_decode($errormsg);
		}else{
			$response['errormsg'] = '';
		}
		
		$response['state_code'] = $fetchStateName['state_code'];
		$response['placeofsupply'] = $fetchStateName['state_name'];
		
		
				
				$response['success'] = '1';
				$response['details'] = "GSTIN No Successfully Verified!!";
	} else {
				$response['success'] = '0';
				$response['state_code'] = $fetchStateName['state_code'];
				$response['placeofsupply'] = $fetchStateName['state_name'];
				$response['tradename'] = '';
				$response['details'] = "GSTIN No Not Valid!!";
	}
		
	
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);