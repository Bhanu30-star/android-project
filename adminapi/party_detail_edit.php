<?php
include("../../connect.php"); 
$response = array();

if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['party_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$scro=date("Y-m-d");
	$scri=date('H:i:sa');
	
	$p_id = $_POST['party_id'];
	$pphone = $_POST['party_phone'];
	$p_name = mysqli_real_escape_string($con,$_POST['party_name']);
	$p_address = mysqli_real_escape_string($con,$_POST['party_addBodyParameterress']);
	$pbeat_detail=mysqli_real_escape_string($con,$_POST['beat_detail']);
	$p_supply = $_POST['place_of_supply'];
	$state_effectdate = $_POST['state_effect_date'];
	$distributor_place_supply=$_POST['distributor_place_supply'];
	$gst_effectdate = $_POST['gst_effect_date'];
	$state_nm = $_POST['state_name'];
	$p_code = $_POST['party_code'];
	$gstin = $_POST['gstin_no'];
	$pan_no = $_POST['pan_it_no'];
	$toder = $_POST['total_order'];
	$latitude = isset($_POST['latitude']) ? $_POST['latitude'] : '0';
	$longitude = isset($_POST['longitude']) ? $_POST['longitude'] : '0';
	$shipaddress1=mysqli_real_escape_string($con,$_POST['shipping_address']);
	$shipaddresshindi=mysqli_real_escape_string($con,$_POST['shipaddresshindi']);
	$einvoice_val=isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
	$owner_name11 = isset($_POST['owner_name']) ? $_POST['owner_name'] : '';
	$paddresshindi=mysqli_real_escape_string($con,$_POST['paddresshindi']);
	$pnamehindi=mysqli_real_escape_string($con,$_POST['pnamehindi']);
	
	$error_msg=0;
	if($gstin!='' && $p_code!=substr($gstin,0,2))
	{
		$error_msg=1;
	}
	
	if($shipaddress1=='')
		$shipaddress1=$p_address;
	
	$error_msg=0;
	if($pphone!='')
	{
		$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_party where status='Active' and distributor_id='$dis_uid' and party_phone='$pphone' and party_id!='$pid'");
		if(mysqli_num_rows($res_product_stock)>0)
			$error_msg=1;
	}
	
	if($error_msg==0) {
	
		$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
		if(mysqli_num_rows($select_user)>0)
		{     
			while($fetch_user=mysqli_fetch_array($select_user))
			{
				$response['user_status']='1';
				$response['user_imei']=$fetch_user['imei_no'];
				$response['session_id']=$fetch_user['session_id'];
			}
		}
		else
		{
			$response['user_status']='0';
			$response['session_id']='';
			$response['user_imei']='';
		}
		
		$select_party=mysqli_query($con,"select * from tbl_party where party_id='$p_id' && status='Active'");
		if(mysqli_num_rows($select_party)>0)
		{
			$fetch_product11=mysqli_fetch_assoc($select_party);
			$pname1=mysqli_real_escape_string($con,$fetch_product11['party_name']);
			$pdis1=$fetch_product11['distributor_id'];
			$pphone1=$fetch_product11['party_phone'];
			$paddress1=mysqli_real_escape_string($con,$fetch_product11['party_address']);
			$pgstin1=$fetch_product11['gstin_no'];
			$place_of_supply1=$fetch_product11['place_of_supply'];
			$party_code1=$fetch_product11['party_code'];
			$state_name1=$fetch_product11['state_name'];
			$pan_it_no1=$fetch_product11['pan_it_no'];
			$pshipaddress1=mysqli_real_escape_string($con,$fetch_product11['party_ship_address']);
			$party_type1=$fetch_product11['party_type'];
			$pbeat_detail1=$fetch_product11['beat_detail'];
			$party_latitude1=$fetch_product11['party_latitude'];
			$party_longitude1=$fetch_product11['party_longitude'];
			$user_map_detail='';
			$map_ik=1;
			$res_party_fse_map = mysqli_query($con,"select user_id from tbl_party_user where party_id='$p_id'");
			while($fetch_mapping=mysqli_fetch_assoc($res_party_fse_map))
			{
				if($map_ik==1)
					$user_map_detail=$fetch_mapping['user_id'];
				else
					$user_map_detail=$user_map_detail.','.$fetch_mapping['user_id'];
				$map_ik++;
			}			
			
			$insert_history = mysqli_query($con,"INSERT IGNORE INTO tbl_party_history(party_id,party_name,party_phone,distributor_id,gstin_no, tb_insertdatetime, party_address, group_name,state_name,pan_it_no,place_of_supply,party_code,party_type,party_ship_address,beat_detail,party_latitude,party_longitude,user_detail,state_effect_date,gst_effect_date,`party_name_hindi`,`address_hindi`,`ship_address_hindi`,`tcs_applicable`)values('$p_id','$pname1','$pphone1','$pdis1','$pgstin1','$cdate','$paddress1','Sundry Debtors','$state_name1','$pan_it_no1','$place_of_supply1','$party_code1','$party_type1','$pshipaddress1','$pbeat_detail1','$party_latitude1','$party_longitude1','$user_map_detail','$state_effectdate','$gst_effectdate','".$fetch_product11['party_name_hindi']."','".$fetch_product11['address_hindi']."','".$fetch_product11['ship_address_hindi']."','".$fetch_product11['tcs_applicable']."')");	

			
			$update_party=mysqli_query($con,"delete from tbl_party_user where party_id='$p_id'");
			
			if($place_of_supply1!=$p_supply && $state_effectdate!='')
			{
				$show_flag_1 = 0;
				if($distributor_place_supply=='')
				{
					$show_flag_1 = 0; 
				}
				else
				{
					if($p_supply==$distributor_place_supply)
						$show_flag_1=0;
					else
						$show_flag_1=1;
				}
				if($show_flag_1==0)
				{
					$uq_update=mysqli_query($con,"update tbl_party_transaction_detail set CGST_amount =round((IGST_amount/2),2),SGST_amount =round((IGST_amount/2),2) WHERE IGST_amount>0 AND CGST_amount=0 AND transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$state_effectdate' and transaction_to='$p_id')");
					$uq_gst_update=mysqli_query($con,"update gst_reports_jan2018 set total_cgst_amt =round((total_igst_amt/2),2),total_sgst_amt =round((total_igst_amt/2),2) WHERE total_igst_amt>0 AND total_cgst_amt=0 AND transaction_date>='$state_effectdate' and transaction_to='$p_id' and distributor_id='$session_dist_ver'");
					if($uq_update)
					{
						$uq_update_2=mysqli_query($con,"update tbl_party_transaction_detail set IGST_amount =0 WHERE transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$state_effectdate' and transaction_to='$p_id')");
						$uq_gst_update=mysqli_query($con,"update gst_reports_jan2018 set total_igst_amt =0 WHERE transaction_date>='$state_effectdate' and transaction_to='$p_id' and distributor_id='$session_dist_ver'");
					}
				}
				else
				{
					$uq_update=mysqli_query($con,"update tbl_party_transaction_detail set IGST_amount =round((CGST_amount+SGST_amount),2) WHERE IGST_amount=0 AND CGST_amount>0 AND transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$state_effectdate' and transaction_to='$p_id')");
					$uq_gst_update=mysqli_query($con,"update gst_reports_jan2018 set total_igst_amt =round((total_cgst_amt+total_sgst_amt),2) WHERE total_cgst_amt>0 AND total_igst_amt=0 AND transaction_date>='$state_effectdate' and transaction_to='$p_id' and distributor_id='$session_dist_ver'");
					if($uq_update)
					{
						$uq_update_2=mysqli_query($con,"update tbl_party_transaction_detail set CGST_amount =0,SGST_amount=0 WHERE transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$state_effectdate' and transaction_to='$p_id')");
						$uq_gst_update=mysqli_query($con,"update gst_reports_jan2018 set total_cgst_amt =0,total_sgst_amt=0 WHERE transaction_date>='$state_effectdate' and transaction_to='$p_id' and distributor_id='$session_dist_ver'");
					}									
				}
			}
		} 
		if($insert_history)
		{  
			$result_secret = mysqli_query($con,"select * from tbl_gst_api_auth_detail");
			$row_secret = mysqli_fetch_array($result_secret);
			$legalname = $tradename = $pincode1 = $location1=$paddBodyParameterress='';
			if($gstin!='')
			{
				$verified='No';
				$pcode=substr($gstin,0,2);
				
				$curl = curl_init();
				curl_setopt_array($curl, array(
				  CURLOPT_URL => 'https://gstapi.charteredinfo.com/commonapi/v1.1/search?aspid=1684392722&password=Jaipur%40123&Action=TP&SearchGstin='.$gstin,
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
	
	
	
			$update_party_qry=mysqli_query($con,"UPDATE tbl_party SET party_name='$p_name', distributor_id='$session_dist_ver', gstin_no='$gstin', party_address='$p_address', place_of_supply='$p_supply', state_name='$state_nm', party_code='$p_code' , pan_it_no='$pan_no' , tb_updatedatetime='$scri',party_ship_address='$shipaddress1',beat_detail='$pbeat_detail',party_longitude='$longitude',party_latitude='$latitude',`party_name_hindi`='$pnamehindi',`address_hindi`='$paddresshindi', `ship_address_hindi`='$shipaddresshindi',owner_name='$owner_name11',tcs_applicable='$einvoice_val',legal_name='$legalname2', location='$location1',party_pincode='$pincode1',verified='$verified',trade_name='$tradename2',party_phone='$pphone' WHERE party_id='$p_id'");
			if($update_party_qry)
			{ 
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$uid=$person_a['uid'];
					$res_check = mysqli_query($con,"select * from tbl_party_user where user_id='$uid' and party_id='$p_id'");
					if(mysqli_num_rows($res_check)<=0)
					{
						$query11 = mysqli_query($con,"insert into tbl_party_user(party_id,user_id,insert_date)values('$p_id','$uid','$scro')");
					}
					
				}
				if($gst_effectdate!='')
				{
					$uq_bills=mysqli_query($con,"UPDATE tbl_party_transaction SET party_gstin='$gstin' where transaction_to='$p_id' and transaction_date>='$gst_effectdate'");
					$uq_bills_gst=mysqli_query($con,"UPDATE gst_reports_jan2018 SET gstin_no='$gstin' where transaction_to='$p_id' and transaction_date>='$gst_effectdate' and distributor_id='$session_dist_ver'");
				}
				$response['success']='1';
				$response['details']="Party Detail Updated Successfully";
			}
			else
			{
			 $response['success']='0';
			 $response['details']="Error In Party Updating 1";	
			}
		}
		else
		{
		  $response['success']='0';
		  $response['details']="Error In Party Updating 2";	
		}
	}
	else
	{
		 $response['success']='0';
		 $response['details']="Party State not valid!!";	
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>