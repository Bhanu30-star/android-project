<?php
include("../../connect.php");
$response = array();
if(isset($_POST['gstin']))
{
	$gstin=$_POST['gstin'];
	$result_secret = mysqli_query($con,"select * from tbl_gst_api_auth_detail");
    $row_secret = mysqli_fetch_array($result_secret);
	
	if($gstin!='')
	{
		$oldurl='https://gstapi.charteredinfo.com/';
		$curl = curl_init();
		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://einvapimum1.charteredinfo.com/commonapi/v1.1/search?aspid=1684392722&password=Jaipur%40123&Action=TP&SearchGstin='.$gstin,
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
		if($decoded_json_tkn["lgnm"]!='')
		{
			$response['buyer_statecode']=$buyer_statecode=substr($gstin,0,2);
			$response['legalname']=$legalname = $decoded_json_tkn["lgnm"];
			$response['tradename']=$tradename = $decoded_json_tkn["tradeNam"];
			$array_check=$decoded_json_tkn["pradr"];
			$response['pincode1']=$pincode1=$array_check["addr"]["pncd"];
			$response['location1']=$location1=$array_check["addr"]["dst"];
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
			
			
			$response['baddress1']=$baddress1;
			$response['placeofsupply']=$placeofsupply=$array_check["addr"]["stcd"];
		}
		else
		{
			$curl = curl_init();
				curl_setopt_array($curl, array(
					CURLOPT_URL => 'https://api.whitebooks.in/public/search?email=dy%40zucolsolutions.com&gstin='.$gstin,
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
					$response['legalname'] = mysqli_real_escape_string($con,$decoded_json_tkn['data']["lgnm"]);
					$response['tradename'] = mysqli_real_escape_string($con,$decoded_json_tkn['data']["tradeNam"]);
					$array_check=$decoded_json_tkn['data']["pradr"];
					$response['pincode1']=$array_check["addr"]["pncd"];
					$response['location1']=$array_check["addr"]["dst"];
					$response['placeofsupply']==$array_check["addr"]["stcd"];
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
					response['baddress1']==$baddress1.', '.$array_check["addr"]["loc"].', '.$array_check["addr"]["dst"].', '.$array_check["addr"]["stcd"].', '.$array_check["addr"]["pncd"];
				}
				else
				{
					$response['error']=$result;
				}
				
		}
		$response['success']='1';
		$response['details']="GSTIN No Successfully Verified!!";
	}else{
		$response['success']='0';
		$response['details']="Please Enter GSTIN No!!";
	}
}	
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>
