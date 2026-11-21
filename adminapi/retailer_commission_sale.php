<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['distributor_id']) && isset($_POST['final_amt']) && isset($_POST['invoice_type']))
{  
	$client1 = $_POST['key_uid'];
	$amount = $_POST['amount'];   
	$final_amt = $_POST['final_amt']; 
	$round_off_amt = $_POST['round_off_amt']; 	
	$toder = $_POST['total_order'];
	$p_client = $_POST['key_pid']; 
	$gstconfig=isset($_POST['gstconfig']) ? $_POST['gstconfig'] : '';
	$party_gstin = isset($_POST['party_gstin']) ? $_POST['party_gstin'] : '';
	$pmode = $_POST['payment_mode'];
	$pstatus = $_POST['payment_status'];
	$dis_id = $_POST['distributor_id'];
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	$invoice_type1=$_POST['invoice_type'];

	$cheque_amt=$final_amt;
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	
	$month_arr=array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
	$month_arr_temp=array("J","K","L","A","B","C","D","E","F","G","H","I");
	$curre_month=date("M",$temp_date2);
	for($gh=0;$gh<count($month_arr);$gh++)
	{
		if($month_arr[$gh]==$curre_month)
		{
			$temp_string=$month_arr_temp[$gh];
		}
	}
	$temp_explode="";
	if($invoice_type1=="Tax Invoice")
	{
		$select_order=mysqli_query($con,"select recent_sequence from `tbl_sequence` where distributor_id='$dis_id'");
		$select_row =  mysqli_fetch_assoc($select_order);
		if(mysqli_num_rows($select_order)>0)
		{
			$temp=$select_row['recent_sequence'];
			$check_seq=mysqli_query($con,"select bill_sequence from `tbl_distributor` where distributor_id='$dis_id'");
			$select_seq =  mysqli_fetch_assoc($check_seq);
			if($select_seq['bill_sequence']=="Standard")
			{
				if($temp_string==$temp[0])
				{
					$final_invoice=(int)substr($temp,1);
					$final_invoice=$final_invoice+1;
					$final_invoice1=(string)$final_invoice;
					$string_count=5-(int)strlen($final_invoice1);
					for($vb=0;$vb<$string_count;$vb++)
					{
						$temp_explode=$temp_explode."0";
					}
					$sd=$temp_string.$temp_explode.$final_invoice;
				}
				else
				{
					$sd=$temp_string."00001";
				}
			}
			else
			{
				$temp_explode=substr($temp,0,2);
				$final_invoice=(int)substr($temp,2);
				$final_invoice=$final_invoice+1;
				$sd=$temp_explode.$final_invoice;
			}
			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET recent_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");
		}
		else
		{
			$sd=$temp_string."00001";
			$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,recent_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
		}	
	}
	
	if($uq_sequence)
	{
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$res = mysqli_query($con,"insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_from,transaction_to,total_amount,payment_mode,payment_status,cheque_amount,remark,final_amt,bill_type,round_off_amt,bill_date,latitude,longitude,party_gstin,generated_by,sign_image,gst_configure,source,gst_invoice_generation)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$cheque_amt','$remark','$final_amt','$invoice_type1','$round_off_amt','$da','$latitude','$longitude','$party_gstin','','','$gstconfig','Admin','Commission')");	
		$re = mysqli_insert_id($con);
		if($res)
		{
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $person_a)
			{
				$prodid=$person_a['pid'];
				$prodname=$person_a['pname'];
				$ordquantiy=$person_a['quantity'];
				$proprice=$person_a['pro_price'];
				$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
				$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
				$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
				$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
				$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';
				$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';
				
				$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount,product_price,IGST_amount,gst_perc,product_total_amt,taxable_amount)values('$transaction_id','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$igstamt','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt')");
			}	
			$response['success']=1;
			$response['details']=$sd;
			$response['pmode']=$pmode;
		}
		else
		{
			$response['success']=0;
			$response['details']="Insertion Error...!!";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Insertion Error...!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 