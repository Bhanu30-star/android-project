<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['pname']) && isset($_POST['distributor_id']) && isset($_POST['paddBodyParameterress']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$pname=mysqli_real_escape_string($con,$_POST['pname']);
	$pnamehindi=mysqli_real_escape_string($con,$_POST['pnamehindi']);
	$pphone=$_POST['pphone'];
	$toder = $_POST['total_order'];
	$partytype=$_POST['partytype'];
	$beat_detail=mysqli_real_escape_string($con,$_POST['beat_detail']);
	$dln_no = isset($_POST['dln_no']) ? $_POST['dln_no'] : '';
	$paddBodyParameterress = mysqli_real_escape_string($con,$_POST['paddBodyParameterress']);
	$paddresshindi=mysqli_real_escape_string($con,$_POST['paddresshindi']);
	$pgstin = isset($_POST['pgstin']) ? $_POST['pgstin'] : '';
	$ppanno = isset($_POST['ppanno']) ? $_POST['ppanno'] : '';
	$pstate = isset($_POST['pstate']) ? $_POST['pstate'] : '';
	$pcode = isset($_POST['pcode']) ? $_POST['pcode'] : '';
	
	$error_msg=0;
	if($pgstin!='' && $pcode!=substr($pgstin,0,2))
	{
		$error_msg=1;
	}
	
	if($error_msg==0) {
	
		$placecountry = isset($_POST['placecountry']) ? $_POST['placecountry'] : 'India';
		$place_currency = isset($_POST['place_currency']) ? $_POST['place_currency'] : 'INR';
		
		$owner_name = isset($_POST['owner_name']) ? $_POST['owner_name'] : '';
		$party_latitude = isset($_POST['party_latitude']) ? $_POST['party_latitude'] : '';
		$party_longitude = isset($_POST['party_longitude']) ? $_POST['party_longitude'] : '';
		$psupply=$_POST['psupply'];
		$shipaddress1=mysqli_real_escape_string($con,$_POST['shipping_address']);
		$shipaddresshindi=mysqli_real_escape_string($con,$_POST['shipaddresshindi']);
		$party_outstanding=isset($_POST['party_outstanding']) ? $_POST['party_outstanding'] : '0';
		$einvoice_val=isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
		
		$legalname = isset($_POST['legalname']) ? $_POST['legalname'] : '';
		$tradename = isset($_POST['tradename']) ? $_POST['tradename'] : '';
		$pincode1 = isset($_POST['pincode1']) ? $_POST['pincode1'] : '';
		$location1 = isset($_POST['location1']) ? $_POST['location1'] : '';
		
		$cdate=date("Y-m-d");
		$scri=date('H:i:sa');
		
		$check_flag=0;
		if($pphone!='')
		{
			$res_product_stock = mysqli_query($con,"SELECT * FROM tbl_party where distributor_id='$ver' and party_phone='$pphone'");
			if(mysqli_num_rows($res_product_stock)>0)
				$check_flag=1;
		}
		if($check_flag==0)
		{
			if($pgstin!='' && $legalname=='')
			{
				$result_activation = mysqli_query($con,"select * from tbl_gst_api_activation where status='Active'");
				$fetch_activation = mysqli_fetch_array($result_activation);
				if($fetch_activation['api_active']=='Chartered Information')
				{
					$result_secret = mysqli_query($con,"select * from tbl_gst_api_auth_detail");
					$row_secret = mysqli_fetch_array($result_secret);
					$legalname = $tradename = $pincode1 = $location1=$paddBodyParameterress='';
					$verified='No';
					$pcode=substr($pgstin,0,2);
					
					$curl = curl_init();
					curl_setopt_array($curl, array(
					  CURLOPT_URL => 'https://gstapi.charteredinfo.com/commonapi/v1.1/search?aspid=1684392722&password=Jaipur%40123&Action=TP&SearchGstin='.$pgstin,
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
						$verified='Yes';
						$legalname = mysqli_real_escape_string($con,$decoded_json_tkn["lgnm"]);
						$tradename = mysqli_real_escape_string($con,$decoded_json_tkn["tradeNam"]);
						$array_check=$decoded_json_tkn["pradr"];
						$pincode1=$array_check["addr"]["pncd"];
						$location1=$array_check["addr"]["dst"];
						$pstate=$psupply=$array_check["addr"]["stcd"];
						$shipaddress1=$paddBodyParameterress=$array_check["addr"]["bno"].' '.$array_check["addr"]["st"].' '.$array_check["addr"]["loc"].' '.$array_check["addr"]["dst"];
					}
				}
				else
				{
					$pcode=substr($pgstin,0,2);
					$curl = curl_init();
					curl_setopt_array($curl, array(
						CURLOPT_URL => 'https://api.whitebooks.in/public/search?email=dy%40zucol.in&gstin='.$pgstin,
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
						if($array_check["addr"]["flno"]=='')
							$shipaddress1=$paddBodyParameterress=$array_check["addr"]["bno"].' '.$array_check["addr"]["st"].' '.$array_check["addr"]["loc"].' '.$array_check["addr"]["dst"];
						else
							$shipaddress1=$paddBodyParameterress=$array_check["addr"]["flno"].' '.$array_check["addr"]["bno"].' '.$array_check["addr"]["st"].' '.$array_check["addr"]["loc"].' '.$array_check["addr"]["dst"];
					}
				}
			}
			
			$name1 = str_replace("'", "", $pname);
			$pname1 = str_replace("\\", "", $name1);
			if($legalname!='')
			{
				$verified='Yes';
				$legalname1 = str_replace("'", "", $legalname);
				$tradename1 = str_replace("'", "", $tradename);
				$legalname2 = str_replace("\\", "", $legalname1);
				$tradename2 = str_replace("\\", "", $tradename1);
			}
			
			if($shipaddress1=='')
			$shipaddress1=$paddBodyParameterress;
			
			$query = mysqli_query($con,"INSERT IGNORE INTO tbl_party(party_name,party_phone,gstin_no,party_address,tb_insertdatetime, tb_inserttime, group_name,state_name,pan_it_no,place_of_supply,party_code,distributor_id,password,party_type,`DLN_no`,`party_ship_address`,`beat_detail`,`party_latitude`,`party_longitude`,`party_name_hindi`,`address_hindi`,`ship_address_hindi`,`outstanding_amount`,`owner_name`,`tcs_applicable`,legal_name,location,party_pincode,verified,trade_name,country,currancy)values('$pname1','$pphone','$pgstin','$paddBodyParameterress','$cdate','$scri','Sundry Debtors','$pstate','$ppanno','$psupply','$pcode','$ver','$pphone','$partytype','$dln_no','$shipaddress1','$beat_detail','$party_latitude','$party_longitude','$pnamehindi','$paddresshindi','$shipaddresshindi','$party_outstanding','$owner_name','$einvoice_val','$legalname2','$location1','$pincode1','$verified','$tradename2','$placecountry','$place_currency')");
			
			
			$party_id = mysqli_insert_id($con);
			
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $person_a)
			{
				$uid=$person_a['uid'];
				$query11 = mysqli_query($con,"INSERT IGNORE INTO tbl_party_user(party_id,user_id,insert_date)values('$party_id','$uid','$cdate')");
			}
			
			if($party_outstanding>0)
			{
				include("sale-purchase-balance-effect-class.php");
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->salecollection($ver,$party_outstanding,$cdate,$party_id);
			}
			$response['success']='1';
			$response['message']="Insert Successful";			
		}
		else
		{
			$response['success']='1';
			$response['message']="Party already exists";
		}
	}
	else
	{
		$response['success']='0';
		$response['message']="Party State not valid!!";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>