<?php
$response = array();
include("../../connect.php");
if(isset($_POST['searchparty']) && isset($_POST['distributor_id']))
{  
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$pp_id_val=$_POST['searchparty'];
	$bill_month=$_POST['getmonth'];
	$bill_year=$_POST['getyear'];
	$final_amount_paid=$_POST['total_amount'];
	$actual_amount_paid1=$_POST['final_amt'];
	$round_off_amount=$_POST['round_off_amount'];
	$toder = $_POST['total_order'];
	$cyear=date("Y");
	$cmonth=date("m");
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$check_c_month='No';
	$cdate1 = $bill_year."-".$bill_month."-01";
	if($bill_year==$cyear && $bill_month==$cmonth)
	{
		$cdate2 = $da;
		$check_c_month='Yes';
	}
	else
	{
		$cdate2 = $bill_year."-".$bill_month."-28";
		$cdate2=date("Y-m-t", strtotime($cdate2));
	}
	$search_party=explode("-",$pp_id_val);
	$party_name_val=trim($search_party[0]);
	$party_phone_val=trim($search_party[1]);		

	$result = mysqli_query($con,"select tbl_party.party_id,tbl_party_user.user_id,tbl_party.gstin_no from tbl_party,tbl_party_user where tbl_party_user.party_id=tbl_party.party_id and tbl_party.distributor_id='$ver' and tbl_party.party_phone='$party_phone_val' and party_name='$party_name_val' and tbl_party.status='Active' limit 1");
	while($row_party = mysqli_fetch_array($result))
	{
		$pp_id1=$row_party['party_id'];
		$u_id1=$row_party['user_id'];
		$party_gstinno=$row_party['gstin_no'];
	}									
	$temp="";
	$select_order=mysqli_query($con,"select max(transaction_bill_number) as bill_txn_id from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type in ('Tax Invoice','Payout')");
	while($select_row =  mysqli_fetch_assoc($select_order))
	{
		$temp=$select_row['bill_txn_id'];
	}
	if($temp!="")
	{			
		$temp_string=$temp[0];
		$temp_explode="";
		$final_invoice=(int)substr($temp,1);
		$final_invoice=$final_invoice+1;
		$final_invoice1=(string)$final_invoice;
		$string_count=5-(int)strlen($final_invoice1);
		for($vb=0;$vb<$string_count;$vb++)
		{
			$temp_explode=$temp_explode."0";
		}
		$sd=$temp_string.$temp_explode.$final_invoice;
		$temp=$sd;
	}
	else
	{
		$temp_date2=strtotime($cdate1);
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
		$sd=$temp_string."00001";
		$temp=$sd;
	}
	if($check_c_month=="Yes")
		$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET recent_sequence='$sd',last_update_datetime='$scri' where distributor_id='$ver'");
	if($temp!='')
	{
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$res = mysqli_query($con,"insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_to,total_amount,payment_status,bill_type,final_amt,bill_date,round_off_amt,transaction_from,party_gstin,gst_configure)values('$transaction_id','$cdate2','$scro','$sd','$pp_id1','$final_amount_paid','Complete','Payout','$actual_amount_paid1','$cdate2','$round_off_amount','$u_id1','$party_gstinno','Inclusive')");
		if($res)
		{
			$res1 = mysqli_query($con,"SELECT transaction_id FROM  tbl_party_transaction where transaction_to='$pp_id1' and bill_type='Payout' ORDER BY `id` DESC LIMIT 1");
			$row =  mysqli_fetch_assoc($res1);
			if(mysqli_num_rows($res1)>0)
			{		
				$re= $row['transaction_id'];
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$proid=$person_a['pid'];
					$prodname=$person_a['pname'];
					$pquanity=$person_a['quantity'];
					$proprice=$person_a['pro_price'];
					$temp_hsn_code=isset($person_a['hsn_code']) ? $person_a['hsn_code'] : '';
					$pcgst = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
					$psgst = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
					$pigst = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
					$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
					$pur_total_amt =round($final_amount_paid,2);
					$pur_taxable_amt = round($final_amount_paid-$pcgst-$psgst-$pigst,2);					
					
					
					$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount,product_price,IGST_amount,gst_perc,product_total_amt,taxable_amount)values('$re','$proid','$prodname','$pquanity','$pcgst','$psgst','$proprice','$pigst','$gst_perc','$pur_total_amt','$pur_taxable_amt')");
					
					$query_gst=mysqli_query($con,"INSERT INTO `gst_reports_jan2018`(`distributor_id`, `hsn_code`, `gstin_no`, `transaction_to`, `bill_type`, `total_sale`, `total_cgst_amt`, `total_sgst_amt`,`total_igst_amt`, `transaction_bill_number`, `party_name`, `transaction_date`, `transaction_time`) VALUES ('$ver','$temp_hsn_code','$party_gstinno','$pp_id1','Payout','$actual_amount_paid1','$pcgst','$psgst','$pigst','$sd','$party_name_val','$cdate2','$scro')");
					
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=stock_quantity-'$pquanity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");	
					
					$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$stock_quantity=$row_stock['closing_stock'];
						$temp_quantity=round($stock_quantity-$pquanity,2);
						$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$da' and distributor_id='$ver' and product_id='$proid'");	
					}
					else
					{
						$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=round($stock_quantity-$pquanity,2);
							$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$da','$scri')");
						}
					}
				}
			}
			$response['success']=1;
			$response['details']=$sd;
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